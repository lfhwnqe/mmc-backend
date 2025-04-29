import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core';
import { weatherWorkflow } from './workflows';
import { storytellingAgent } from './agents';
import { createRagAgent } from './agents/rag-agent';
import { RagService } from '../modules/rag/rag.service';
import { Logger } from '@nestjs/common';

// 添加NestJS Logger
const logger = new Logger('MastraInstance');

// 记录模块加载时间，用于验证环境变量加载时机
const moduleLoadTime = new Date().toISOString();
logger.log(`Mastra模块加载时间: ${moduleLoadTime}`);

/**
 * 创建Mastra实例，注册工作流和代理
 * @param ragService RAG服务实例
 * @returns Mastra实例
 */
export function createMastraInstance(ragService: RagService) {
  // 记录函数调用时间
  const functionCallTime = new Date().toISOString();
  
  // 确保环境变量能正确传递给mastra
  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  
  logger.log(`createMastraInstance调用时间: ${functionCallTime}`);
  logger.log(`OPENAI_API_KEY存在: ${!!openaiKey}, OPENROUTER_API_KEY存在: ${!!openrouterKey}`);
  
  if (!openaiKey) {
    logger.warn('⚠️ OPENAI_API_KEY环境变量未设置，这可能导致RAG和OpenAI相关功能失败');
  }

  const ragAgent = createRagAgent(ragService);

  return new Mastra({
    workflows: { weatherWorkflow },
    agents: {
      storytellingAgent,
      ragAgent,
    },
    logger: createLogger({
      name: 'Mastra',
      level: 'info',
    }),
  });
}

let mastraInstance: Mastra;

/**
 * 获取或初始化Mastra实例
 * @param ragService RAG服务实例
 * @returns Mastra实例
 */
export function getMastra(ragService?: RagService): Mastra {
  const functionCallTime = new Date().toISOString();
  logger.log(`getMastra调用时间: ${functionCallTime}`);
  
  if (!mastraInstance && ragService) {
    logger.log('首次初始化Mastra实例');
    mastraInstance = createMastraInstance(ragService);
  } else if (!mastraInstance) {
    throw new Error('Mastra实例未初始化，请提供RagService');
  }
  return mastraInstance;
}

// 确保环境变量能正确传递给mastra
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  logger.warn('⚠️ OPENAI_API_KEY环境变量未设置，这可能导致RAG和OpenAI相关功能失败');
} else {
  logger.log(`OPENAI_API_KEY已配置，长度: ${openaiKey.length}`);
}

// 检查OpenRouter API Key
const openrouterKey = process.env.OPENROUTER_API_KEY;
if (!openrouterKey) {
  logger.warn('⚠️ OPENROUTER_API_KEY环境变量未设置，Storytelling Agent可能无法正常工作');
} else {
  logger.log(`OPENROUTER_API_KEY已配置，长度: ${openrouterKey.length}`);
}

// 初始化不带RAG的mastra实例
logger.log('初始化不带RAG的mastra实例');
export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { storytellingAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
