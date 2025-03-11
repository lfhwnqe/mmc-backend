import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  Param,
  ForbiddenException,
  Delete,
} from '@nestjs/common';
import { AudioSceneService } from './audio-scene.service';
import { CreateAudioSceneDto, QueryAudioSceneDto } from './dto/audio-scene.dto';

@Controller('audio-scene')
export class AudioSceneController {
  constructor(private readonly audioSceneService: AudioSceneService) {}

  @Post()
  async create(@Req() req: any, @Body() createDto: CreateAudioSceneDto) {
    const userId = req.user.sub;
    return await this.audioSceneService.create(userId, createDto);
  }

  @Get()
  async findMine(@Req() req: any, @Query() query: QueryAudioSceneDto) {
    const userId = req.user.sub;

    // 确保 page 和 pageSize 是数字类型
    if (query.page && typeof query.page === 'string') {
      query.page = parseInt(query.page, 10);
    }
    if (query.pageSize && typeof query.pageSize === 'string') {
      query.pageSize = parseInt(query.pageSize, 10);
    }

    console.log('findMine query params:', {
      userId,
      page: query.page,
      pageSize: query.pageSize,
      type: typeof query.page,
    });

    return await this.audioSceneService.findByUserId(userId, query);
  }

  @Get('scene/:sceneName')
  async findBySceneName(
    @Req() req: any,
    @Param('sceneName') sceneName: string,
    @Query() query: QueryAudioSceneDto,
  ) {
    const userId = req.user.sub;

    // 确保 page 和 pageSize 是数字类型
    if (query.page && typeof query.page === 'string') {
      query.page = parseInt(query.page, 10);
    }
    if (query.pageSize && typeof query.pageSize === 'string') {
      query.pageSize = parseInt(query.pageSize, 10);
    }

    console.log('findBySceneName query params:', {
      userId,
      sceneName,
      page: query.page,
      pageSize: query.pageSize,
      type: typeof query.page,
    });

    return await this.audioSceneService.findBySceneName(
      userId,
      sceneName,
      query,
    );
  }

  @Get(':sceneId')
  async findOne(@Req() req: any, @Param('sceneId') sceneId: string) {
    const userId = req.user.sub;
    const scene = await this.audioSceneService.findOne(userId, sceneId);
    if (!scene) {
      throw new ForbiddenException('Scene not found or access denied');
    }
    return scene;
  }

  @Delete(':id')
  async deleteScene(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.audioSceneService.deleteScene(userId, id);
  }
}
