import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Index } from '@upstash/vector';
import { MDocument } from '@mastra/rag';
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

type VectorMetadata = {
  text: string;
  [key: string]: any;
};

/**
 * RAG服务接口类型，用于管理向量库和检索增强功能
 */
@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private vectorStore: Index<VectorMetadata>;
  private readonly chunkSize: number = 500;
  private readonly chunkOverlap: number = 50;
  private readonly embeddingModel = 'text-embedding-3-small';
  private readonly openaiApiKey: string;

  constructor(private configService: ConfigService) {
    // 获取API密钥，优先使用配置服务，然后回退到环境变量
    this.openaiApiKey =
      this.configService.get('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;

    if (!this.openaiApiKey) {
      this.logger.warn('OPENAI_API_KEY未配置，RAG服务可能无法正常工作');
    } else {
      this.logger.log('OPENAI_API_KEY已配置');
      // 确保环境变量也被设置，因为一些库可能直接从环境变量读取
      process.env.OPENAI_API_KEY = this.openaiApiKey;
    }

    // 初始化Upstash向量存储
    this.vectorStore = new Index<VectorMetadata>({
      url: this.configService.get('UPSTASH_VECTOR_URL'),
      token: this.configService.get('UPSTASH_VECTOR_TOKEN'),
    });

    this.logger.log('RAG服务已初始化:', {
      embeddingModel: this.embeddingModel,
      upstashVectorUrl: this.configService.get('UPSTASH_VECTOR_URL')
        ? '已配置'
        : '未配置',
      openaiApiKey: this.openaiApiKey ? '已配置' : '未配置',
    });
  }

  /**
   * 使用OpenAI生成文本嵌入 - 单个文本
   * @param text 要嵌入的文本
   * @returns 嵌入向量
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OPENAI_API_KEY未配置，无法生成嵌入向量');
      }

      // 完全按照Mastra官方文档示例处理
      const { embeddings } = await embedMany({
        model: openai.embedding(this.embeddingModel),
        values: [text],
      });

      return embeddings[0];
    } catch (error) {
      this.logger.error(`生成嵌入向量失败: ${error.message}`, error.stack);
      throw new Error(`生成嵌入向量失败: ${error.message}`);
    }
  }

  /**
   * 将文档分割并存储到向量数据库中
   * @param text 文档文本
   * @param metadata 文档元数据
   * @param isMarkdown 是否为Markdown格式
   * @returns 存储的文档数量
   */
  async addDocument(
    text: string,
    metadata: Record<string, any> = {},
    isMarkdown = true,
  ): Promise<number> {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OPENAI_API_KEY未配置，无法添加文档');
      }

      // 使用Mastra将文本转换为文档并进行分块
      let document;
      if (isMarkdown) {
        document = MDocument.fromMarkdown(text);
      } else {
        document = MDocument.fromText(text);
      }

      // 分割文档
      const chunks = await document.chunk({
        strategy: isMarkdown ? 'markdown' : 'recursive',
        size: this.chunkSize,
        overlap: this.chunkOverlap,
        extract: {
          metadata: true,
        },
      });

      this.logger.debug(`文档已分割为${chunks.length}个块`);

      // 按照Mastra官方文档示例生成嵌入
      const { embeddings } = await embedMany({
        model: openai.embedding(this.embeddingModel),
        values: chunks.map((chunk) => chunk.text),
      });

      // 为每个文档创建向量
      const vectors = chunks.map((chunk, index) => {
        return {
          id: `${metadata.id || Date.now()}-${index}`,
          vector: embeddings[index],
          metadata: {
            ...metadata,
            text: chunk.text,
            // 添加Mastra提取的元数据（如果有）
            ...(chunk.metadata || {}),
          },
        };
      });

      // 批量上传向量
      await this.vectorStore.upsert(vectors);
      this.logger.log(`成功添加${vectors.length}个文档向量到数据库`);
      return vectors.length;
    } catch (error) {
      this.logger.error('添加文档失败', error.stack);
      throw new Error(`添加文档失败: ${error.message}`);
    }
  }

  /**
   * 根据查询文本检索相关文档
   * @param query 查询文本
   * @param limit 返回结果数量限制
   * @returns 相关文档列表
   */
  async search(
    query: string,
    limit = 5,
  ): Promise<Array<{ pageContent: string; metadata: Record<string, any> }>> {
    try {
      // 为查询生成嵌入向量
      const queryEmbedding = await this.generateEmbedding(query);

      // 执行向量相似度搜索
      const results = await this.vectorStore.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        includeVectors: false,
      });

      // 转换查询结果为统一格式
      return results.map((result) => {
        return {
          pageContent: result.metadata.text,
          metadata: {
            ...result.metadata,
            text: undefined,
            score: result.score,
          },
        };
      });
    } catch (error) {
      this.logger.error('搜索文档失败', error.stack);
      throw new Error(`搜索文档失败: ${error.message}`);
    }
  }

  /**
   * 根据ID删除文档
   * @param id 文档ID前缀
   * @returns 删除是否成功
   */
  async deleteDocumentsByPrefix(id: string): Promise<boolean> {
    try {
      // 删除匹配的向量
      const result = await this.vectorStore.delete([id]);
      if (result.deleted > 0) {
        this.logger.log(`成功删除与 ${id} 匹配的文档向量`);
        return true;
      } else {
        this.logger.warn(`没有找到与 ${id} 匹配的文档`);
        return false;
      }
    } catch (error) {
      this.logger.error('删除文档失败', error.stack);
      throw new Error(`删除文档失败: ${error.message}`);
    }
  }
}
