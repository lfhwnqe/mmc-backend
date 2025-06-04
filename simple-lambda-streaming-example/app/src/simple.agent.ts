import { Agent, ModelProvider, streamToAsyncIterable } from '@mastra/core'; // Assuming ModelProvider and streamToAsyncIterable
import { OpenRouter } from '@openrouter/ai-sdk-provider'; // Using the AI SDK provider for OpenRouter

// Helper to ensure OPENROUTER_API_KEY is accessed safely
function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // In a real app, you might throw an error or have better logging
    console.warn('OPENROUTER_API_KEY is not set. The agent may not work.');
    return ''; // Return empty string or handle as appropriate
  }
  return apiKey;
}

// Define a simple model provider for OpenRouter using the AI SDK
const openRouterInstance = new OpenRouter({
  apiKey: getOpenRouterApiKey(),
  // You can add other OpenRouter configurations here if needed
  // referer: "YOUR_SITE_URL", // Optional: Your app's name or URL
  // siteName: "YOUR_APP_NAME", // Optional
});

// Specify a free model available on OpenRouter
// Example: Mistral 7B Instruct, or Google Gemma
const model = openRouterInstance.chat('mistralai/mistral-7b-instruct-v0.2');
// const model = openRouterInstance.chat('anthropic/claude-3-haiku-20240307'); // Another option
// const model = openRouterInstance.chat('google/gemma-7b-it'); // Another option


export function createSimpleAgent(): Agent {
  return new Agent({
    name: 'SimpleChatAgent',
    instructions: 'You are a helpful assistant. Respond concisely and clearly.',
    model: model, // Use the OpenRouter model
    tools: {}, // No tools for this simple agent
  });
}
