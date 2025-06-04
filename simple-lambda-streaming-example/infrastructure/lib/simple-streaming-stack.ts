import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class SimpleStreamingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function for streaming
    const streamingFunction = new lambdaNodejs.NodejsFunction(this, 'StreamChatFunction', {
      runtime: lambda.Runtime.NODEJS_18_X, // Or a newer compatible version
      architecture: lambda.Architecture.ARM_64,
      handler: 'streamChat',
      entry: path.join(__dirname, '../../app/src/streaming.handler.ts'), // Path from infrastructure/lib to app/src

      projectRoot: path.join(__dirname, '../../app'), // Explicitly set project root
      depsLockFilePath: path.join(__dirname, '../../app/yarn.lock'), // Assuming yarn.lock; use package-lock.json if that's what's in app/

      bundling: {
        externalModules: [
          'aws-sdk',
        ],
        // Ensure esbuild uses the tsconfig from the app project
        tsconfig: path.join(__dirname, '../../app/tsconfig.json'),
      },
      environment: {
        NODE_ENV: 'development',
        // OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '', // User will inject
      },
      timeout: cdk.Duration.minutes(1), // Adjust as needed
      memorySize: 512, // Adjust as needed
      loggingFormat: lambda.LoggingFormat.JSON,
    });

    // Add Lambda Function URL for streaming
    const functionUrl = streamingFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // For easy testing
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM, // CRITICAL for streaming
      cors: {
        allowedOrigins: ['*'], // Be more specific for production
        allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
        allowedHeaders: ['content-type', 'authorization'], // Add any other headers
        // allowCredentials: true, // If your client sends credentials
      },
    });

    // Output the Function URL
    new cdk.CfnOutput(this, 'StreamingFunctionUrlOutput', {
      value: functionUrl.url,
      description: 'The URL of the streaming Lambda function',
    });
  }
}
