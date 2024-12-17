import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Context, Handler } from 'aws-lambda';
import * as express from 'express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

let cachedServer: Handler;

async function bootstrap(): Promise<Handler> {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();
    cachedServer = serverlessExpress({ 
      app: expressApp,
      binarySettings: {
        isBinary: () => false,
      },
    });
  }
  return cachedServer;
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: any,
) => {
  try {
    console.log('Lambda event:', event);
    if (event.path) {
      const stage = process.env.NODE_ENV === 'dev' ? 'dev' : 'prod';
      event.path = event.path.replace(`/${stage}`, '');
      if (event.rawPath) {
        event.rawPath = event.rawPath.replace(`/${stage}`, '');
      }
    }
    const server = await bootstrap();
    const response = await server(event, context, callback);
    console.log('Lambda response:', response);
    return response;
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
}; 