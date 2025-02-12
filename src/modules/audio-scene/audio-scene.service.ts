import { Injectable, ForbiddenException } from '@nestjs/common';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {
  CreateAudioSceneDto,
  QueryAudioSceneDto,
  AudioSceneDto,
} from './dto/audio-scene.dto';
import { v4 as uuidv4 } from 'uuid';
import { AudioService } from '../audio/audio.service';

@Injectable()
export class AudioSceneService {
  private readonly dynamoDb: DynamoDBDocument;
  private readonly tableName: string;

  constructor(private readonly audioService: AudioService) {
    this.dynamoDb = DynamoDBDocument.from(new DynamoDB());
    const stage = process.env.NODE_ENV === 'dev' ? 'dev' : 'prod';
    this.tableName = `audio-scene-table-${stage}`;
  }

  async create(userId: string, createDto: CreateAudioSceneDto) {
    const timestamp = new Date().toISOString();
    const sceneId = uuidv4();

    const item = {
      sceneId,
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
    });

    return {
      success: true,
      message: '场景创建成功',
      data: item,
    };
  }

  async findByUserId(userId: string, queryDto: QueryAudioSceneDto) {
    const { page = 1, pageSize = 20 } = queryDto;

    // 首先获取总数
    const countResult = await this.dynamoDb.query({
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Select: 'COUNT',
    });

    const total = countResult.Count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // 如果没有数据，直接返回空结果
    if (total === 0) {
      return {
        success: true,
        data: {
          items: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        },
      };
    }

    // 获取分页数据
    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ProjectionExpression:
        'sceneId, userId, sceneName, audioUrl, #st, createdAt, updatedAt',
      ExpressionAttributeNames: {
        '#st': 'status', // 使用别名来引用 status 字段
      },
      Limit: pageSize,
      ScanIndexForward: false,
      ...(page > 1 && {
        ExclusiveStartKey: await this.getPageKey(userId, page, pageSize),
      }),
    });

    return {
      success: true,
      data: {
        items: result.Items as AudioSceneDto[],
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  }

  async findBySceneName(
    userId: string,
    sceneName: string,
    queryDto: QueryAudioSceneDto,
  ) {
    const { page = 1, pageSize = 20 } = queryDto;

    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'sceneNameIndex',
      KeyConditionExpression: 'sceneName = :sceneName',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':sceneName': sceneName,
        ':userId': userId,
      },
      ProjectionExpression:
        'userId, sceneName, audioUrl, #st, createdAt, updatedAt',
      ExpressionAttributeNames: {
        '#st': 'status',
      },
      Limit: pageSize,
      ScanIndexForward: false,
    });

    const total = result.Count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        items: result.Items as AudioSceneDto[],
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  }

  async findOne(userId: string, sceneId: string) {
    const result = await this.dynamoDb.get({
      TableName: this.tableName,
      Key: {
        userId,
        sceneId,
      },
    });

    if (!result.Item) {
      return {
        success: false,
        message: '场景不存在',
      };
    }

    // 检查是否是当前用户的场景
    if (result.Item.userId !== userId) {
      throw new ForbiddenException('没有权限访问此场景');
    }

    return {
      success: true,
      data: result.Item as AudioSceneDto,
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
    });

    return result.LastEvaluatedKey;
  }

  async deleteScene(userId: string, sceneId: string) {
    try {
      // 1. 先获取场景信息，以获取音频文件的 key
      const scene = await this.findOne(userId, sceneId);
      if (!scene.success) {
        throw new Error('场景不存在');
      }

      // 2. 删除 S3 中的音频文件
      await this.audioService.deleteFile(scene.data.audioUrl);

      // 3. 删除场景记录
      await this.dynamoDb.delete({
        TableName: this.tableName,
        Key: {
          userId,
          sceneId,
        },
      });

      return {
        success: true,
        message: '删除成功',
      };
    } catch (error) {
      console.error('Delete scene error:', error);
      throw new Error('删除场景失败');
    }
  }
}
