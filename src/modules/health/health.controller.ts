import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    try {
      const info = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        region: process.env.AWS_REGION,
        runtime: 'Lambda',
        version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
      };
      console.log('Health check info:', info);
      return info;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
} 