import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 添加 cookie-parser 中间件
  app.use(cookieParser());

  // CORS 中间件配置
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const origin = req.headers.origin;

      // 检查请求来源是否允许
      const allowedOrigins = [
        /^http:\/\/localhost(:\d+)?$/,
        /^https?:\/\/([\w-]+\.)?maomaocong\.site$/,
      ];

      const isAllowed = allowedOrigins.some((pattern) =>
        pattern.test(origin || ''),
      );

      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin || '');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, Accept',
        );
        res.setHeader('Access-Control-Max-Age', '3600');
      }

      // 处理预检请求
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    },
  );

  await app.listen(3001);
}
bootstrap();
