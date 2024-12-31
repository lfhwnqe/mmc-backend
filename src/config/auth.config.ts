import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  userPoolId: process.env.USER_POOL_ID,
  userPoolClientId: process.env.USER_POOL_CLIENT_ID,
  mockEndpoint: process.env.MOCK_COGNITO_ENDPOINT,
  mockCredentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
}));
