import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
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

  @Post('openrouter-test')
  async testOpenRouter(@Body() request: ChatCompletionRequest) {
    try {
      const baseUrl = this.configService.get('OPENROUTER_BASE_URL');
      const apiKey = this.configService.get('OPENROUTER_API_KEY');

      if (!baseUrl || !apiKey) {
        throw new Error('OpenRouter 配置未定义');
      }

      console.log('OpenRouter Test - Request:', {
        baseUrl,
        apiKeyLength: apiKey?.length,
        messageCount: request.messages?.length,
      });

      // 如果没有消息，使用默认测试消息
      const messages =
        request.messages && request.messages.length > 0
          ? request.messages
          : [
              {
                role: 'user',
                content: '你好，这是一个测试消息。请用中文回复。',
              },
            ];

      // 确保API URL正确 - OpenRouter API应该直接使用baseUrl
      const apiUrl = `${baseUrl}/chat/completions`;
      console.log('OpenRouter API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://mmc.com',
          'X-Title': 'MMC-Test',
        },
        body: JSON.stringify({
          model: request.model || 'anthropic/claude-3-haiku',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      // 获取响应文本，然后尝试解析为JSON
      const responseText = await response.text();
      console.log('OpenRouter API Response Text:', responseText);

      if (!response.ok) {
        // 尝试解析错误响应为JSON，如果失败则使用原始文本
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            console.error('OpenRouter API Error:', errorData);
            errorMessage = errorData.error?.message || errorMessage;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage += ` - Raw response: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      // 仅当有响应文本时才尝试解析JSON
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from OpenRouter API');
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('OpenRouter API Response Data:', data);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error(
          `Failed to parse API response: ${responseText.substring(0, 100)}...`,
        );
      }

      // 检查响应数据的格式是否符合预期
      if (
        !data.choices ||
        !Array.isArray(data.choices) ||
        data.choices.length === 0
      ) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from OpenRouter API');
      }

      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        raw: data, // 返回原始响应以便调试
      };
    } catch (error) {
      console.error('OpenRouter Test Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw new HttpException(
        error.message || 'OpenRouter 测试失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('openrouter-config')
  async testOpenRouterConfig() {
    try {
      const baseUrl = this.configService.get('OPENROUTER_BASE_URL');
      const apiKey = this.configService.get('OPENROUTER_API_KEY');
      if (!baseUrl || !apiKey) {
        throw new Error('OPENROUTER_CONFIG is not defined');
      }

      return {
        success: true,
        message: '成功获取 OpenRouter 配置',
        data: {
          apiUrlConfigured: !!baseUrl,
          apiKeyConfigured: !!apiKey,
          apiKeyLength: apiKey?.length || 0,
          apiUrl: baseUrl || '未配置',
        },
      };
    } catch (error) {
      console.error('OpenRouter Config Test Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw new HttpException(
        error.message || '测试 OpenRouter 配置失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
