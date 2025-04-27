import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core';
import { weatherWorkflow } from './workflows';
import { storytellingAgent } from './agents';
import { createRagAgent } from './agents/rag-agent';
import { RagService } from '../modules/rag/rag.service';

/**
 * 创建Mastra实例，注册工作流和代理
 * @param ragService RAG服务实例
 * @returns Mastra实例
 */
export function createMastraInstance(ragService: RagService) {
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
  if (!mastraInstance && ragService) {
    mastraInstance = createMastraInstance(ragService);
  } else if (!mastraInstance) {
    throw new Error('Mastra实例未初始化，请提供RagService');
  }
  return mastraInstance;
}

// 暂时导出不带RAG的mastra实例，后续会被替换
export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { storytellingAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
