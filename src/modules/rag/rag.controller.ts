import {
  Body,
  Controller,
  Delete,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { RagService } from './rag.service';
import {
  AddDocumentDto,
  BaseResponseDto,
  SearchQueryDto,
  SearchResultsResponseDto,
} from './dto/rag.dto';

@Controller('rag')
export class RagController {
  constructor(private ragService: RagService) {}

  /**
   * 添加文档到向量库
   */
  @Post('documents')
  async addDocument(
    @Body() document: AddDocumentDto,
  ): Promise<BaseResponseDto> {
    try {
      const count = await this.ragService.addDocument(
        document.text,
        document.metadata || {},
      );
      return {
        success: true,
        message: `成功添加${count}个文档向量到数据库`,
        count,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '添加文档失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 根据查询搜索相关文档
   */
  @Post('search')
  async search(
    @Body() searchDto: SearchQueryDto,
  ): Promise<SearchResultsResponseDto> {
    try {
      const results = await this.ragService.search(
        searchDto.query,
        searchDto.limit,
      );
      return {
        success: true,
        count: results.length,
        results: results.map((doc) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: doc.metadata.score,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message || '搜索文档失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 删除指定ID的文档
   */
  @Delete('documents/:id')
  async deleteDocument(@Param('id') id: string): Promise<BaseResponseDto> {
    try {
      const success = await this.ragService.deleteDocumentsByPrefix(id);
      if (success) {
        return {
          success: true,
          message: `成功删除与 ${id} 匹配的文档`,
        };
      } else {
        return {
          success: false,
          message: `没有找到与 ${id} 匹配的文档`,
        };
      }
    } catch (error) {
      throw new HttpException(
        error.message || '删除文档失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
