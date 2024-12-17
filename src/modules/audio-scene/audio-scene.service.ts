import { Injectable, ForbiddenException } from '@nestjs/common';
import { DynamoDB } from 'aws-sdk';
import { CreateAudioSceneDto, QueryAudioSceneDto, PaginatedResponseDto, AudioSceneDto } from './dto/audio-scene.dto';

@Injectable()
export class AudioSceneService {
  private readonly dynamoDb: DynamoDB.DocumentClient;
  private readonly tableName: string;

  constructor() {
    this.dynamoDb = new DynamoDB.DocumentClient();
    const stage = process.env.NODE_ENV === 'dev' ? 'dev' : 'prod';
    this.tableName = `audio-scene-table-${stage}`;
  }

  async create(userId: string, createDto: CreateAudioSceneDto) {
    const timestamp = new Date().toISOString();
    const item = {
      userId,
      content: createDto.content,
      audioUrl: createDto.audioUrl,
      sceneName: createDto.sceneName,
      status: createDto.status || 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.dynamoDb.put({
      TableName: this.tableName,
      Item: item,
    }).promise();

    return item;
  }

  async findByUserId(userId: string, queryDto: QueryAudioSceneDto): Promise<PaginatedResponseDto<AudioSceneDto>> {
    const { page = 1, pageSize = 20 } = queryDto;
    
    // 首先获取总数
    const countResult = await this.dynamoDb.query({
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Select: 'COUNT',
    }).promise();

    const total = countResult.Count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // 如果没有数据，直接返回空结果
    if (total === 0) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    // 获取分页数据
    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: pageSize,
      ScanIndexForward: false, // 按时间倒序
      // 如果不是第一页，使用 ExclusiveStartKey
      ...(page > 1 && {
        ExclusiveStartKey: await this.getPageKey(userId, page, pageSize),
      }),
    }).promise();

    return {
      items: result.Items as AudioSceneDto[],
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findBySceneName(userId: string, sceneName: string, queryDto: QueryAudioSceneDto): Promise<PaginatedResponseDto<AudioSceneDto>> {
    const { page = 1, pageSize = 20 } = queryDto;

    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'sceneNameIndex',
      KeyConditionExpression: 'sceneName = :sceneName',
      FilterExpression: 'userId = :userId', // 只查询当前用户的场景
      ExpressionAttributeValues: {
        ':sceneName': sceneName,
        ':userId': userId,
      },
      Limit: pageSize,
      ScanIndexForward: false,
    }).promise();

    const total = result.Count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items: result.Items as AudioSceneDto[],
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  private async getPageKey(userId: string, page: number, pageSize: number) {
    if (page <= 1) return undefined;

    const offset = (page - 1) * pageSize;
    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: 1,
      ScanIndexForward: false,
      Select: 'ALL_ATTRIBUTES',
      ExclusiveStartKey: undefined, // 从头开始
    }).promise();

    return result.LastEvaluatedKey;
  }

  // 获取单个场景详情
  async findOne(userId: string, sceneId: string): Promise<AudioSceneDto> {
    const result = await this.dynamoDb.get({
      TableName: this.tableName,
      Key: {
        userId,
        sceneId,
      },
    }).promise();

    if (!result.Item) {
      return null;
    }

    // 检查是否是当前用户的场景
    if (result.Item.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this scene');
    }

    return result.Item as AudioSceneDto;
  }
} 