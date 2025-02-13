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
    OPENAI_CONFIG: JSON.stringify({
      apiKey: process.env.OPENAI_API_KEY || '',
      apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    }),
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
    OPENAI_CONFIG: JSON.stringify({
      apiKey: process.env.OPENAI_API_KEY || '',
      apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    }),
  }),
};

export default () => {
  const environment = process.env.NODE_ENV || 'dev';
  return configurations[environment]();
};
