import { Controller, Post, Get, Body, Req, Query, Param, ForbiddenException } from '@nestjs/common';
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
    return await this.audioSceneService.findByUserId(userId, query);
  }

  @Get('scene/:sceneName')
  async findBySceneName(
    @Req() req: any,
    @Param('sceneName') sceneName: string,
    @Query() query: QueryAudioSceneDto,
  ) {
    const userId = req.user.sub;
    return await this.audioSceneService.findBySceneName(userId, sceneName, query);
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
} 