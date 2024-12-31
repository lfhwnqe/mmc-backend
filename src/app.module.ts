import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { AuthMiddleware } from './modules/auth/middleware/auth.middleware';
import { AudioSceneModule } from './modules/audio-scene/audio-scene.module';
import { AudioModule } from './modules/audio/audio.module';
import configuration from './config/configuration';

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
      )
      .forRoutes('*');
  }
}
