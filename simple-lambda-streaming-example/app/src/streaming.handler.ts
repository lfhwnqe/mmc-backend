// simple-lambda-streaming-example/app/src/streaming.handler.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // From the minimal app
import { ChatService } from './chat.service'; // From the minimal app
import { Writable } from 'stream';

// This is a global provided by the Lambda runtime environment for streaming
// Ensure this is declared if not using a specific AWS Lambda types package that includes it.
declare const awslambda: any;

interface LambdaEvent {
  body?: string; // Assuming JSON string with { "prompt": "user query" } or just plain text query
  queryStringParameters?: { [key: string]: string }; // e.g., /?prompt=user%20query
}

// Cached NestJS application context
let appCtx;
async function getAppContext() {
  if (!appCtx) {
    // Create a lightweight application context for the minimal NestJS app
    // Disable verbose logging for this context if not needed for Lambda
    appCtx = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    });
  }
  return appCtx;
}

export const streamChat = awslambda.streamifyResponse(
  async (event: LambdaEvent, responseStream: Writable, context: any) => {
    console.log('streamChat handler invoked with event:', JSON.stringify(event));

    // Set content type for Server-Sent Events (SSE)
    responseStream.setContentType('text/event-stream; charset=utf-8');

    // Send an initial SSE message to indicate the stream is starting
    responseStream.write('data: {"status": "Stream initiated..."}\n\n');

    try {
      const nestContext = await getAppContext();
      const chatService = nestContext.get(ChatService);

      // Extract user prompt from the event
      let userPrompt = 'Hello! Tell me a fun fact.'; // Default prompt
      if (event.body) {
        try {
          const parsedBody = JSON.parse(event.body);
          if (parsedBody.prompt) {
            userPrompt = parsedBody.prompt;
          }
        } catch (e) {
          // If body is not JSON or doesn't have a prompt field, treat the body as a plain text prompt
          if (typeof event.body === 'string' && event.body.trim().length > 0) {
            userPrompt = event.body;
          }
          console.warn('Event body was not JSON or did not contain a prompt field. Treating as plain text if available.', e);
        }
      } else if (event.queryStringParameters && event.queryStringParameters.prompt) {
        userPrompt = event.queryStringParameters.prompt;
      }

      console.log(`Processing prompt: "${userPrompt.substring(0, 100)}..."`);
      responseStream.write(`data: {"status": "Processing your prompt..."}\n\n`);

      const mastraResponse = await chatService.getAgentResponseStream(userPrompt);

      if (!mastraResponse || !mastraResponse.textStream) {
        console.error('Mastra agent did not return a valid textStream.');
        throw new Error('Failed to get a valid stream from the AI agent.');
      }

      responseStream.write('data: {"status": "AI agent stream started..."}\n\n');

      // Iterate over the async iterable textStream and write chunks to the responseStream
      for await (const chunk of mastraResponse.textStream) {
        // Each chunk is expected to be a string.
        // Format as SSE: data: { "content": "your chunk content here" } \n\n


        // Ensure chunks are properly JSON stringified if they contain special characters.
        const formattedChunk = chunk.replace(/\n/g, '\\n'); // Basic newline escaping for JSON string
        responseStream.write(`data: ${JSON.stringify({ content: formattedChunk })}\n\n`);
      }

      responseStream.write('data: {"status": "Stream completed.", "done": true}\n\n');
      console.log('Successfully streamed AI response.');

    } catch (error) {
      console.error('Error during AI streaming:', error.message, error.stack);
      // Send an error message over the stream if possible
      try {
        const errorMessage = {
          error: error.message || 'An unexpected error occurred during streaming.',
        };
        // Ensure the stream is still writable before attempting to write an error
        if (!responseStream.writableEnded) {
          responseStream.write(`data: ${JSON.stringify(errorMessage)}\n\n`);
        }
      } catch (writeError) {
        console.error('Failed to write error to stream:', writeError);
      }
    } finally {
      // Ensure the stream is always ended.
      if (!responseStream.writableEnded) {
        responseStream.end();
      }
    }
  },
);
