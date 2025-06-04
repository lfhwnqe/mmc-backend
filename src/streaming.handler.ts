import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // Assuming AppModule providers RagService and can setup Mastra
import { RagService } from './modules/rag/rag.service';
import { getMastra } from './mastra'; // Assuming getMastra is accessible and correctly typed
import { Writable } from 'stream'; // For typing responseStream if needed, though not strictly necessary for awslambda

// This is a global provided by the Lambda runtime environment for streaming
declare const awslambda: any;

interface LambdaEvent {
  // Define the expected structure of the event, e.g., from Lambda Function URL
  // For now, let's assume it might have a body with a query
  body?: string; // Or a more structured object if you parse JSON
  queryStringParameters?: { [key: string]: string };
}

// Helper function to initialize NestJS app context and get services
// This helps in reusing NestJS services without bootstrapping the full HTTP server
let appCtx;
async function getAppContext() {
  if (!appCtx) {
    appCtx = await NestFactory.createApplicationContext(AppModule, {
      // Disable logging for this lightweight context if it's too verbose,
      // or configure it as needed.
      logger: ['error', 'warn'],
    });
  }
  return appCtx;
}

export const streamRagChatHandler = awslambda.streamifyResponse(
  async (event: LambdaEvent, responseStream: Writable, context: any) => {
    console.log('streamRagChatHandler invoked with event:', JSON.stringify(event));

    responseStream.setContentType('text/event-stream; charset=utf-8');
    responseStream.write('data: {"status": "Starting RAG stream..."}\n\n'); // Initial SSE message

    try {
      const appContext = await getAppContext();
      const ragService = appContext.get(RagService);

      // Ensure Mastra is initialized with RagService if needed by its setup
      // This depends on how `getMastra` and your Mastra setup in `src/mastra/index.ts` works.
      // If `getMastra` itself initializes or requires RagService, this is correct.
      const mastraInstance = getMastra(ragService);
      const ragAgent = mastraInstance.getAgent('ragAgent');

      if (!ragAgent) {
        throw new Error('RAG Agent not found or not initialized correctly.');
      }

      // Extract user query from the event.
      // This needs to be adapted based on how you invoke the Lambda Function URL.
      // For example, if it's a POST with JSON body:
      let userQuery = 'Default query: Tell me about streaming.';
      if (event.body) {
        try {
          const parsedBody = JSON.parse(event.body);
          if (parsedBody.query) {
            userQuery = parsedBody.query;
          } else if (parsedBody.messages && Array.isArray(parsedBody.messages) && parsedBody.messages.length > 0) {
            const lastUserMessage = parsedBody.messages.filter(m => m.role === 'user').pop();
            if (lastUserMessage && lastUserMessage.content) {
              userQuery = lastUserMessage.content;
            }
          }
        } catch (e) {
          console.warn('Failed to parse event body as JSON or extract query:', e);
          // Fallback if body is plain text
          if (typeof event.body === 'string' && event.body.trim().length > 0) {
             userQuery = event.body;
          }
        }
      } else if (event.queryStringParameters && event.queryStringParameters.query) {
        userQuery = event.queryStringParameters.query;
      }

      console.log(`Processing query: "${userQuery}"`);
      responseStream.write(`data: {"status": "Query received: ${userQuery.substring(0,50)}..."}\n\n`);

      const agentResponseStream = await ragAgent.stream([
        {
          role: 'user',
          content: userQuery,
        },
      ]);

      if (!agentResponseStream || !agentResponseStream.textStream) {
        throw new Error('Mastra agent did not return a valid textStream.');
      }

      responseStream.write('data: {"status": "Agent stream started..."}\n\n');

      for await (const chunk of agentResponseStream.textStream) {
        // Each chunk should be a string. Wrap it in the SSE data format.
        // Escape newlines within the chunk if they are not part of the SSE message structure.
        const formattedChunk = chunk.replace(/\n/g, '\\n');
        responseStream.write(`data: ${JSON.stringify({ content: formattedChunk })}\n\n`);
      }

      responseStream.write('data: {"status": "Stream complete.", "done": true}\n\n');
      console.log('Successfully streamed RAG response.');

    } catch (error) {
      console.error('Error during RAG streaming:', error);
      // Send an error message over the stream if possible
      try {
        const errorMessage = {
          error: error.message || 'An unexpected error occurred.',
          details: error.stack, // Be cautious about sending stack traces in production
        };
        responseStream.write(`data: ${JSON.stringify(errorMessage)}\n\n`);
      } catch (writeError) {
        console.error('Failed to write error to stream:', writeError);
      }
    } finally {
      responseStream.end();
    }
  },
);
