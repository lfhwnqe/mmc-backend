import { createTool } from '@mastra/core';
import { z } from 'zod';
import { RagService } from '../../modules/rag/rag.service';

/**
 * 创建RAG检索工具函数
 * @param ragService RAG服务实例
 * @returns RAG检索工具
 */
export function createRagTool(ragService: RagService) {
  return createTool({
    id: 'rag-search',
    description: '检索知识库中与查询相关的文档',
    inputSchema: z.object({
      query: z.string().describe('要查询的文本'),
      limit: z.number().optional().describe('返回结果数量限制，默认为5'),
    }),
    execute: async ({ context }) => {
      try {
        const query = context.query;
        const limit = context.limit || 5;
        const results = await ragService.search(query, limit);
        if (results.length === 0) {
          return '未找到相关信息。';
        }

        // 格式化结果为文本
        return results
          .map((doc, index) => {
            const score = doc.metadata.score
              ? `(相关度: ${(doc.metadata.score * 100).toFixed(2)}%)`
              : '';
            return `文档 ${index + 1} ${score}\n${doc.pageContent}\n`;
          })
          .join('\n');
      } catch (error) {
        return `检索过程中出错: ${error.message}`;
      }
    },
  });
}
