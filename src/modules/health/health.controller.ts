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

  @Get('deep')
  async deepCheck() {
    try {
      const info = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        region: process.env.AWS_REGION,
        runtime: 'Lambda',
        version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        // 添加更多详细信息
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          AWS_REGION: process.env.AWS_REGION,
          USER_POOL_ID: process.env.USER_POOL_ID,
          USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID,
        },
      };
      // console.log('Deep health check info:', info);
      return info;
    } catch (error) {
      console.error('Deep health check error:', error);
      throw error;
    }
  }
}
