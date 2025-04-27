import { Agent } from '@mastra/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createRagTool } from '../tools/rag-tool';
import { RagService } from '../../modules/rag/rag.service';

/**
 * 创建RAG增强的AI助手
 * @param ragService RAG服务实例
 * @returns RAG增强的AI助手
 */
export function createRagAgent(ragService: RagService) {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const model = openrouter.chat('anthropic/claude-3.5-sonnet');
  const ragTool = createRagTool(ragService);

  return new Agent({
    name: 'RAG知识增强助手',
    instructions: `
      你是一个拥有本地知识库增强的英语学习助手。
      
      ## 工作原则
      1. 始终先检查你的知识库，再回答用户问题
      2. 如果知识库中有相关信息，你必须基于这些信息来回答
      3. 如果知识库中没有相关信息，你应当坦诚说明，然后尽可能基于你自己的知识提供帮助
      4. 永远不要编造知识库中不存在的信息
      5. 优先使用中文回答用户问题，除非用户明确要求使用英语
      
      ## 英语学习专长
      - 语法解释和纠正
      - 口语表达和写作指导
      - 文化背景知识讲解
      - 学习方法和资源推荐
      
      当你回答基于知识库的问题时，应当引用来源并使用markdown格式化你的回答，使其易于阅读。
    `,
    model,
    tools: { ragTool },
  });
}
