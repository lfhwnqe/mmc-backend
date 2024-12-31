import { Module } from '@nestjs/common';
import { AudioSceneController } from './audio-scene.controller';
import { AudioSceneService } from './audio-scene.service';
import { AudioService } from '../audio/audio.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [AudioSceneController],
  providers: [AudioSceneService, AudioService],
})
export class AudioSceneModule {}
