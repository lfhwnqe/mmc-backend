#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';

// 根据环境加载对应的 .env 文件
const stage = process.env.NODE_ENV || 'dev';
const envPath = path.resolve(__dirname, `../../.env.${stage}`);
dotenv.config({ path: envPath });

console.log('Loading environment variables from:', envPath);

const app = new cdk.App();
// const appName = 'Mmc-Cdk-Backend';

// 确保设置了默认区域
// if (!process.env.CDK_DEFAULT_REGION) {
//   throw new Error('CDK_DEFAULT_REGION environment variable is required');
// }
// console.log('process.env.CDK_DEFAULT_REGION:', process.env.CDK_DEFAULT_REGION);

const stackName = `Mmc-Cdk-Backend-${stage.charAt(0).toUpperCase() + stage.slice(1)}`;
new AuthStack(app, stackName, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
    // region: process.env.CDK_DEFAULT_REGION,
  },
  openApiConfig: {
    apiKey: process.env.OPENAI_API_KEY || '',
    apiUrl: process.env.OPENAI_API_URL || '',
  },
  bedrockModels: {
    AMAZON_NOVA_PRO_V1_0:
      bedrock.FoundationModelIdentifier.AMAZON_NOVA_PRO_V1_0,
    AMAZON_NOVA_LITE_V1_0_300_K:
      bedrock.FoundationModelIdentifier.AMAZON_NOVA_LITE_V1_0_300_K,
    AMAZON_TITAN_EMBED_TEXT_V2_0:
      bedrock.FoundationModelIdentifier.AMAZON_TITAN_EMBED_TEXT_V2_0,
  },
});
