import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Logger,
  Res,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { ChatCompletionRequest } from './ai.types';
import { ConfigService } from '@nestjs/config';
import { mastra } from '../../mastra';
import { getMastra } from '../../mastra';
import { RagService } from '../rag/rag.service';
import { Response as ExpressResponse } from 'express';

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
    private readonly ragService: RagService,
  ) {}

  @Post('openrouter-test')
  async testOpenRouter(@Body() request: ChatCompletionRequest) {
    try {
      const baseUrl = this.configService.get('OPENROUTER_BASE_URL');
      const apiKey = this.configService.get('OPENROUTER_API_KEY');

      if (!baseUrl || !apiKey) {
        throw new Error('OpenRouter 配置未定义');
      }

      this.logger.log('OpenRouter Test - Request:', {
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
      this.logger.log('OpenRouter API URL:', apiUrl);

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
      this.logger.log('OpenRouter API Response Text:', responseText);

      if (!response.ok) {
        // 尝试解析错误响应为JSON，如果失败则使用原始文本
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            this.logger.error('OpenRouter API Error:', errorData);
            errorMessage = errorData.error?.message || errorMessage;
          }
        } catch (parseError) {
          this.logger.error('Failed to parse error response:', parseError);
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
        this.logger.log('OpenRouter API Response Data:', data);
      } catch (parseError) {
        this.logger.error('JSON Parse Error:', parseError);
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
        this.logger.error('Invalid response format:', data);
        throw new Error('Invalid response format from OpenRouter API');
      }

      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        raw: data, // 返回原始响应以便调试
      };
    } catch (error) {
      this.logger.error('OpenRouter Test Error:', {
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
      this.logger.error('OpenRouter Config Test Error:', {
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

  @Post('storytelling')
  async storytelling(
    @Body()
    request: {
      prompt?: string;
      messages?: Array<{ role: string; content: string }>;
      id?: string;
    },
  ) {
    try {
      // 检查请求参数
      this.logger.log('Storytelling 原始请求:', JSON.stringify(request));

      // 确保存在提示内容 - 支持两种格式：直接的prompt字段或messages数组
      let promptContent = request?.prompt?.trim();

      // 如果没有prompt字段但有messages数组，从消息中提取用户内容
      if (!promptContent && request?.messages && request.messages.length > 0) {
        const userMessage = request.messages.find((msg) => msg.role === 'user');
        if (userMessage) {
          promptContent = userMessage.content;
        }
      }

      if (!promptContent) {
        this.logger.error('没有提供有效的故事提示');
        throw new HttpException('请提供故事提示', HttpStatus.BAD_REQUEST);
      }

      this.logger.log('Storytelling Agent - 有效请求内容:', {
        promptContent,
        contentLength: promptContent.length,
      });

      // 检查OpenRouter API环境变量
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        this.logger.error(
          'OPENROUTER_API_KEY环境变量未设置，这会导致Storytelling Agent调用失败',
        );
        throw new Error('OpenRouter API Key未配置');
      }

      // 从mastra实例获取storytellingAgent
      try {
        const storytellingAgent = mastra.getAgent('storytellingAgent');
        if (!storytellingAgent) {
          this.logger.error('storytellingAgent不存在于mastra实例中');
          throw new Error('Storytelling Agent not found in mastra instance');
        }
        this.logger.log('成功获取到storytellingAgent，准备调用stream方法');
      } catch (agentError) {
        this.logger.error('获取storytellingAgent失败:', {
          name: agentError.name,
          message: agentError.message,
          stack: agentError.stack,
        });
        throw new Error(`获取Storytelling Agent失败: ${agentError.message}`);
      }

      const storytellingAgent = mastra.getAgent('storytellingAgent');

      // 创建流式响应
      let response;
      try {
        this.logger.log('准备调用storytellingAgent.stream方法');
        response = await storytellingAgent.stream([
          {
            role: 'user',
            content: promptContent,
          },
        ]);
        this.logger.log('Stream调用成功，获取到响应对象');
      } catch (streamError) {
        this.logger.error('调用storytellingAgent.stream方法失败:', {
          name: streamError.name,
          message: streamError.message,
          stack: streamError.stack,
        });
        throw new Error(`调用stream方法失败: ${streamError.message}`);
      }

      // 检查response对象
      if (!response || !response.textStream) {
        this.logger.error('未获取到有效的stream响应', { response });
        throw new Error('未获取到有效的stream响应');
      }

      this.logger.log('开始处理流式响应');

      // 处理文本流
      try {
        for await (const chunk of response.textStream) {
          // 记录每个数据块
          this.logger.log('Storytelling Data chunk:', chunk);
        }
      } catch (streamReadError) {
        this.logger.error('读取流数据失败:', {
          name: streamReadError.name,
          message: streamReadError.message,
          stack: streamReadError.stack,
        });
        throw new Error(`读取流数据失败: ${streamReadError.message}`);
      }

      return {
        success: true,
        content: response.textStream.join(''),
        model: response.model,
        raw: response, // 返回原始响应以便调试
      };
    } catch (error) {
      this.logger.error('Storytelling Agent Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      // 错误处理
      throw new HttpException(
        error.message || 'Storytelling Agent 调用失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 使用RAG增强的AI聊天接口
   */
  @Post('rag-chat')
  async ragChat(@Body() request: ChatCompletionRequest) {
    try {
      // 检查是否提供消息
      if (!request.messages || request.messages.length === 0) {
        throw new Error('消息不能为空');
      }

      // 获取Mastra实例并使用RAG代理
      const mastraInstance = getMastra(this.ragService);
      // 提取用户的最后一条消息作为查询
      const lastUserMessage = request.messages
        .filter((msg) => msg.role === 'user')
        .pop();

      if (!lastUserMessage) {
        throw new Error('找不到用户消息');
      }

      // 获取RAG代理
      const ragAgent = mastraInstance.getAgent('ragAgent');
      if (!ragAgent) {
        throw new Error('RAG代理未找到');
      }

      // 运行RAG代理
      const result = await ragAgent.stream([
        {
          role: 'user',
          content: lastUserMessage.content,
        },
      ]);

      // 收集流中的所有文本
      let fullContent = '';
      for await (const chunk of result.textStream) {
        fullContent += chunk;
      }

      return {
        success: true,
        content: fullContent,
        // 暂时不返回model和usage信息，因为stream结果中可能没有
      };
    } catch (error) {
      this.logger.error('RAG聊天错误:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw new HttpException(
        error.message || 'RAG聊天处理失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 使用RAG增强的AI聊天接口 - 流式响应版本
   */
  @Post('stream/rag-chat')
  async streamRagChat(@Body() request: ChatCompletionRequest) {
    // 检查是否提供消息
    if (!request.messages || request.messages.length === 0) {
      throw new HttpException('消息不能为空', HttpStatus.BAD_REQUEST);
    }

    // 获取Mastra实例并使用RAG代理
    const mastraInstance = getMastra(this.ragService);
    // 提取用户的最后一条消息作为查询
    const lastUserMessage = request.messages
      .filter((msg) => msg.role === 'user')
      .pop();

    if (!lastUserMessage) {
      throw new HttpException('找不到用户消息', HttpStatus.BAD_REQUEST);
    }

    // 获取RAG代理
    const ragAgent = mastraInstance.getAgent('ragAgent');
    if (!ragAgent) {
      throw new HttpException(
        'RAG代理未找到',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.log('开始RAG流式请求处理', {
      userMessage:
        lastUserMessage.content.substring(0, 50) +
        (lastUserMessage.content.length > 50 ? '...' : ''),
    });

    // 运行RAG代理
    const result = await ragAgent.stream([
      {
        role: 'user',
        content: lastUserMessage.content,
      },
    ]);

    // 检查response对象
    if (!result || !result.textStream) {
      this.logger.error('未获取到有效的stream响应', { result });
      throw new Error('未获取到有效的stream响应');
    }

    this.logger.log('获取到stream响应，开始传输数据');

    // 处理文本流
    try {
      // 收集所有内容
      let allContent = '';
      const sseChunks = [];

      for await (const chunk of result.textStream) {
        // 记录每个数据块
        this.logger.debug('RAG数据块:', chunk);
        allContent += chunk;

        // 为SSE格式准备数据块
        const jsonString = JSON.stringify({ content: chunk });
        sseChunks.push(`data: ${jsonString}\n\n`);
      }

      // 添加完成标记
      sseChunks.push(`data: ${JSON.stringify({ done: true })}\n\n`);

      // 返回SSE格式的完整响应
      this.logger.log('RAG流式传输准备完成，数据长度:', allContent.length);

      return {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
        body: sseChunks.join(''),
      };
    } catch (error) {
      this.logger.error('处理RAG流数据时出错:', error);
      throw new HttpException(
        `处理RAG流数据失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 故事讲述 - 流式响应版本 (使用/stream路径)
   */
  @Post('stream/storytelling')
  async streamStorytelling(
    @Body()
    request: {
      prompt?: string;
      messages?: Array<{ role: string; content: string }>;
      id?: string;
    },
    @Res() res: ExpressResponse,
  ) {
    this.logger.log(
      '调用 streamStorytelling，原始请求:',
      JSON.stringify(request),
    );

    // 确保存在提示内容 - 支持两种格式：直接的prompt字段或messages数组
    let promptContent = request?.prompt?.trim();

    // 如果没有prompt字段但有messages数组，从消息中提取用户内容
    if (!promptContent && request?.messages && request.messages.length > 0) {
      const userMessage = request.messages.find((msg) => msg.role === 'user');
      if (userMessage) {
        promptContent = userMessage.content;
      }
    }

    if (!promptContent) {
      this.logger.error('没有提供有效的故事提示');
      throw new HttpException('请提供故事提示', HttpStatus.BAD_REQUEST);
    }

    this.logger.log('流式Storytelling Agent - 有效请求内容:', {
      promptContent,
      contentLength: promptContent.length,
    });

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      this.logger.error(
        'OPENROUTER_API_KEY环境变量未设置，这会导致Storytelling Agent调用失败',
      );
      throw new HttpException(
        'OpenRouter API Key未配置',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const storytellingAgent = mastra.getAgent('storytellingAgent');
    if (!storytellingAgent) {
      this.logger.error('storytellingAgent不存在于mastra实例中');
      throw new HttpException(
        'Storytelling Agent not found in mastra instance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    this.logger.log('成功获取到storytellingAgent，准备调用stream方法');

    try {
      const agentStream = await storytellingAgent.stream([
        {
          role: 'user',
          content: promptContent,
        },
      ]);
      this.logger.log('Mastra agent stream调用成功，获取到流对象');

      // 设置SSE响应所需的头信息
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      for await (const chunk of agentStream.textStream) {
        res.write(chunk); // chunk 可是 Buffer/String，保持原样
      }
      res.end();
    } catch (error) {
      this.logger.error('处理 streamStorytelling 时出错:', {
        name: error.name,
        message: error.message,
        stack: error.stack, // 记录堆栈信息以便调试
      });

      // 如果错误已经是 HttpException，直接抛出，让 NestJS 处理
      if (error instanceof HttpException) {
        throw error;
      }

      // 对于其他错误，包装成 HttpException
      throw new HttpException(
        error.message || 'Storytelling Agent 调用或流处理失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
