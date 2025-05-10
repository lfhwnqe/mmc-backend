// AWS Lambda Streaming Response - Official Example

exports.handler = awslambda.streamifyResponse(async (event, responseStream) => {
  // Set content type as text/event-stream for SSE
  responseStream.setContentType('text/event-stream');
  
  try {
    // Send 3 messages with delay between them
    responseStream.write('data: Message 1 - Testing streaming response\n\n');
    console.log('First message sent');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    responseStream.write('data: Message 2 - Testing streaming response\n\n');
    console.log('Second message sent');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    responseStream.write('data: Message 3 - Testing streaming response\n\n');
    console.log('Third message sent');
  } catch (error) {
    console.error('Error in stream processing:', error);
    responseStream.write('data: Error: ' + error.message + '\n\n');
  } finally {
    // Always close the stream when done
    responseStream.end();
  }
});
