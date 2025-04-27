import { ConfigService } from '@nestjs/config';

const configurations = {
  dev: () => ({
    aws: {
      region: 'us-east-1',
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
      region: 'us-east-1',
      // 生产环境特定配置
    },
    api: {
      cors: {
        origin: 'https://web3.maomaocong.site',
      },
    },
  }),
};

export default () => {
  const environment = process.env.NODE_ENV || 'dev';
  return configurations[environment]();
};
