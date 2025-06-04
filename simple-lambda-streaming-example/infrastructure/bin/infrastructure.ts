#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleStreamingStack } from '../lib/simple-streaming-stack';

const app = new cdk.App();
new SimpleStreamingStack(app, 'SimpleLambdaStreamingStack', {
  // Configure your environment if needed, e.g., for a specific AWS account/region
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'Stack for Simple Lambda Streaming Example'
});
