import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * 添加文档请求DTO
 */
export class AddDocumentDto {
  @IsNotEmpty({ message: '文档内容不能为空' })
  @IsString({ message: '文档内容必须是字符串' })
  text: string;

  @IsOptional()
  @IsObject({ message: '元数据必须是对象' })
  metadata?: Record<string, any>;
}

/**
 * 搜索请求DTO
 */
export class SearchQueryDto {
  @IsNotEmpty({ message: '查询关键词不能为空' })
  @IsString({ message: '查询关键词必须是字符串' })
  query: string;

  @IsOptional()
  @IsNumber({}, { message: '结果数量限制必须是数字' })
  limit?: number;
}

/**
 * 搜索结果项DTO
 */
export class SearchResultItemDto {
  content: string;
  metadata: Record<string, any>;
  score?: number;
}

/**
 * 搜索结果响应DTO
 */
export class SearchResultsResponseDto {
  success: boolean;
  count: number;
  results: SearchResultItemDto[];
}

/**
 * 基础响应DTO
 */
export class BaseResponseDto {
  success: boolean;
  message: string;
  count?: number;
} 