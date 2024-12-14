#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();
const appName = 'Mmc-Backend';

// 确保设置了默认区域
if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error('CDK_DEFAULT_REGION environment variable is required');
}

// 开发环境
new AuthStack(app, `${appName}-Dev`, {
  stage: 'dev',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// 生产环境
new AuthStack(app, `${appName}-Prod`, {
  stage: 'prod',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
