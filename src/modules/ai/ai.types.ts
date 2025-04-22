export interface OpenAIConfig {
  apiKey: string;
  apiUrl: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  model?: string;
}

export interface ChatCompletionResponse {
  content: string;
  metadata?: {
    type: 'answer' | 'question' | 'statement';
    tone: 'formal' | 'casual' | 'friendly';
    length: number;
  };
}
