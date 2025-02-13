import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatCompletionRequest, ChatCompletionResponse } from './ai.types';
import { z } from 'zod';
import { HumanMessage } from '@langchain/core/messages';

@Injectable()
export class AIService {
  private openai: ChatOpenAI;

  constructor(private configService: ConfigService) {
    const config = this.configService.get('OPENAI_CONFIG');
    if (!config) {
      throw new Error('OPENAI_CONFIG is not defined');
    }

    const { apiKey, apiUrl } = JSON.parse(config);
    console.log('🌹OpenAI Config:', {
      apiUrl,
      apiKeyLength: apiKey?.length,
    });

    this.openai = new ChatOpenAI({
      openAIApiKey: apiKey,
      configuration: {
        baseURL: apiUrl,
        defaultHeaders: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
      model: 'gpt-4o-mini',
      temperature: 0,
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await this.openai.invoke([
        { role: 'user', content: 'Hi im bob' },
      ]);

      return {
        content: response.content.toString(),
        metadata: {
          type: 'answer',
          tone: 'casual',
          length: response.content.length,
        },
      };
    } catch (error) {
      console.error('🌹AI Service Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw new Error(error.message || 'Failed to process AI request');
    }
  }
}
