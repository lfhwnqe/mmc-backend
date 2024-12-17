import { Module } from '@nestjs/common';
import { AudioSceneController } from './audio-scene.controller';
import { AudioSceneService } from './audio-scene.service';

@Module({
  controllers: [AudioSceneController],
  providers: [AudioSceneService],
})
export class AudioSceneModule {} 