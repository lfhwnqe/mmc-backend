import { ConfigService } from '@nestjs/config';

const configurations = {
  dev: () => ({
    aws: {
      region: 'us-east-2',
      // 测试环境特定配置
    },
    api: {
      cors: {
        origin: 'http://localhost:3000',
      },
    },
  }),

  prod: () => ({
    aws: {
      region: 'us-east-2',
      // 生产环境特定配置
    },
    api: {
      cors: {
        origin: 'https://mn.maomaocong.site',
      },
    },
  }),
};

export default () => {
  const environment = process.env.NODE_ENV || 'dev';
  return configurations[environment]();
};
