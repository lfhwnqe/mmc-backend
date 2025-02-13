import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { ChatCompletionRequest } from './ai.types';
import { ConfigService } from '@nestjs/config';

@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {}

  @Post('chat')
  async chat(@Body() request: ChatCompletionRequest) {
    try {
      console.log('AI Controller - Received request:', {
        messageCount: request.messages?.length,
        messages: request.messages?.map((m) => ({
          role: m.role,
          contentLength: m.content?.length,
        })),
      });

      if (!request.messages || request.messages.length === 0) {
        throw new HttpException('消息不能为空', HttpStatus.BAD_REQUEST);
      }

      const result = await this.aiService.chat(request);
      console.log('AI Controller - Response:', {
        success: true,
        contentLength: result.content?.length,
      });

      return result;
    } catch (error) {
      console.error('AI Controller Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw new HttpException(
        error.message || '处理请求时发生错误',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  async test(@Body() request: ChatCompletionRequest) {
    try {
      const config = this.configService.get('OPENAI_CONFIG');
      if (!config) {
        throw new Error('OPENAI_CONFIG is not defined');
      }

      const { apiKey, apiUrl } = JSON.parse(config);
      console.log('🌹Test Config:', {
        apiUrl,
        apiKeyLength: apiKey?.length,
      });

      const response = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: request.messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      return {
        content: data.choices?.[0]?.message?.content || '',
        raw: data, // 返回原始响应以便调试
      };
    } catch (error) {
      console.error('Test API Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw new HttpException(
        error.message || '测试 API 失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
