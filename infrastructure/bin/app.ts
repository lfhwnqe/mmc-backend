#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

// 检查关键环境变量
if (!process.env.OPENAI_API_KEY) {
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '⚠️  警告: OPENAI_API_KEY 环境变量未设置！',
  );
  console.warn('\x1b[33m%s\x1b[0m', '   RAG功能可能无法正常工作。');
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '   请设置环境变量: export OPENAI_API_KEY=你的密钥',
  );
}

if (!process.env.OPENROUTER_API_KEY) {
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '⚠️  警告: OPENROUTER_API_KEY 环境变量未设置！',
  );
  console.warn('\x1b[33m%s\x1b[0m', '   Storytelling Agent可能无法正常工作。');
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '   请设置环境变量: export OPENROUTER_API_KEY=你的密钥',
  );
}

const stackName = `Mmc-Cdk-Backend-${stage.charAt(0).toUpperCase() + stage.slice(1)}`;

// 显示更多部署信息
console.log('部署信息:');
console.log(' - 堆栈名称:', stackName);
console.log(' - 环境:', stage);
console.log(' - 区域:', 'us-east-1');

new AuthStack(app, stackName, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
    // region: process.env.CDK_DEFAULT_REGION,
  },
});
