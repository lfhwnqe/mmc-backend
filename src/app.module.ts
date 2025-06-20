import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { AuthMiddleware } from './modules/auth/middleware/auth.middleware';
import { AudioSceneModule } from './modules/audio-scene/audio-scene.module';
import { AudioModule } from './modules/audio/audio.module';
import { AIModule } from './modules/ai/ai.module';
import { ImageModule } from './modules/image/image.module';
import configuration from './config/configuration';
import { RagModule } from './modules/rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: `./.env.${process.env.NODE_ENV || 'dev'}`,
    }),
    AuthModule,
    HealthModule,
    AudioSceneModule,
    AudioModule,
    AIModule,
    ImageModule,
    RagModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        '/auth/login',
        '/auth/register',
        '/auth/confirm',
        '/auth/resend-code',
        '/health/deep',
        '/ai/test',
      )
      .forRoutes('*');
  }
}
