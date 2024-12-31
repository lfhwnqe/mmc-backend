import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAudioSceneDto {
  @IsString()
  content: string;

  @IsString()
  audioUrl: string;

  @IsString()
  sceneName: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class AudioSceneDto {
  sceneId: string;
  userId: string;
  content: string;
  audioUrl: string;
  sceneName: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export class QueryAudioSceneDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  sceneName?: string;
}

export class PaginatedResponseDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
