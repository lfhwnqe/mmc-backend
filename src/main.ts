import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  // 本地开发时才需要监听端口
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Server is running on: http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    return null;
  }
  
  const expressApp = app.getHttpAdapter().getInstance();
  const serverlessApp = serverlessExpress({ app: expressApp });
  return serverlessApp;
}

// 本地开发时使用这个
if (process.env.NODE_ENV === 'development') {
  bootstrap();
}

// Lambda 环境使用这个
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};