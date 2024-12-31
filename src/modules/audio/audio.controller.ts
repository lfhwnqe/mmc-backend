import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
  UnauthorizedException,
  Get,
  Param,
  UseFilters,
} from '@nestjs/common';
import { AudioService } from './audio.service';
import { Request } from 'express';
import { ALLOWED_AUDIO_TYPES } from './types/audio.types';
import { HttpExceptionFilter } from 'src/filters/http-exception.filter';

@Controller('audio')
@UseFilters(HttpExceptionFilter)
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('upload-url')
  async getUploadUrl(
    @Body() body: { fileName: string; fileType: string },
    @Req() req: Request,
  ) {
    const { fileName, fileType } = body;

    console.log('Upload URL request:', {
      user: req['user'],
      token: req['token'],
      fileName,
      fileType,
    });

    if (!ALLOWED_AUDIO_TYPES.includes(fileType)) {
      throw new BadRequestException(
        `不支持的文件类型。支持的类型: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
      );
    }

    if (!req['user']?.sub) {
      console.error('Auth error:', {
        user: req['user'],
        headers: req.headers,
      });
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
