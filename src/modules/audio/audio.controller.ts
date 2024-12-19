import { Controller, Post, Body, Req, BadRequestException, UnauthorizedException, Get, Param } from '@nestjs/common';
import { AudioService } from './audio.service';
import { Request } from 'express';
import { ALLOWED_AUDIO_TYPES } from './types/audio.types';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('upload-url')
  async getUploadUrl(
    @Body() body: { fileName: string; fileType: string },
    @Req() req: Request,
  ) {
    const { fileName, fileType } = body;

    // 添加调试日志
    console.log('Request user info:', req['user']);
    console.log('User sub:', req['user']?.sub);

    // 验证文件类型
    if (!ALLOWED_AUDIO_TYPES.includes(fileType)) {
      throw new BadRequestException(
        `不支持的文件类型。支持的类型: ${ALLOWED_AUDIO_TYPES.join(', ')}`
      );
    }

    if (!req['user']?.sub) {
      throw new UnauthorizedException('User ID not found');
    }

    const userId = req['user'].sub;
    const key = `${userId}/${Date.now()}-${fileName}`;
    
    return this.audioService.generateUploadUrl(key, fileType);
  }

  @Get('url/:key')
  async getAudioUrl(@Param('key') key: string) {
    return this.audioService.getSignedUrl(key);
  }
} 