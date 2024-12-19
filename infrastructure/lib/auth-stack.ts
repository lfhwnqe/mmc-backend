import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface AuthStackProps extends cdk.StackProps {
  stage: string;  // 环境标识：dev, test, prod
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const stageName = props.stage;

    // 创建 Cognito 用户池
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${id}-${stageName}-user-pool`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    // 创建应用客户端
    this.userPoolClient = this.userPool.addClient('UserPoolClient', {
      userPoolClientName: `${id}-${stageName}-client`,
      authFlows: {
        userPassword: true,
        adminUserPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    // 创建 Lambda 执行角色
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // 添加 Cognito 权限
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:SignUp',
          'cognito-idp:InitiateAuth',
          'cognito-idp:ConfirmSignUp',
        ],
        resources: [this.userPool.userPoolArn],
      }),
    );

    // 创建 Lambda 函数
    const handler = new lambda.Function(this, 'AuthHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist')),
      role: lambdaRole,
      environment: {
        NODE_ENV: props.stage,
        USER_POOL_ID: this.userPool.userPoolId,
        USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
    });

    // 创建 API Gateway 日志角色
    const apiGatewayLoggingRole = new iam.Role(this, 'ApiGatewayLoggingRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
      ],
    });

    // 创建 API Gateway
    const api = new apigateway.RestApi(this, 'AuthApi', {
      restApiName: `${id}-${stageName}-api`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      deployOptions: {
        stageName: props.stage,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new cdk.aws_logs.LogGroup(this, 'ApiGatewayAccessLogs', {
            retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
          })
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      cloudWatchRole: true,
      binaryMediaTypes: ['*/*'],
    });

    // 将 API Gateway 与 Lambda 集成
    const integration = new apigateway.LambdaIntegration(handler, {
      proxy: true,
      allowTestInvoke: true,
    });

    // 添加根路径代理
    const proxy = api.root.addProxy({
      defaultIntegration: integration,
      anyMethod: true,  // 允许所有 HTTP 方法
    });

    // 创建 DynamoDB 表
    const audioSceneTable = new dynamodb.Table(this, 'AudioSceneTable', {
      tableName: `audio-scene-table-${stageName}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sceneId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 添加新的 GSI，使用不同的名称
    audioSceneTable.addGlobalSecondaryIndex({
      indexName: 'sceneNameIndex-v2',  // 修改索引名称
      partitionKey: { name: 'sceneName', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sceneId', type: dynamodb.AttributeType.STRING },
    });

    // 创建 S3 桶
    const audioBucket = new s3.Bucket(this, 'AudioBucket', {
      bucketName: `${id}-${stageName}-audio-bucket`.toLowerCase(),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // 阻止所有公开访问
      encryption: s3.BucketEncryption.S3_MANAGED, // 使用 S3 管理的加密
      enforceSSL: true, // 强制使用 SSL
      versioned: true, // 启用版本控制
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: [
            'http://localhost:3000',           // 本地开发
            'https://mn.maomaocong.site',      // 生产环境
            'http://localhost:3001',           // 本地后端
          ],
          allowedHeaders: ['*'],
          exposedHeaders: [
            'ETag',
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
          ],
        },
      ],
      removalPolicy: props.stage === 'production' 
        ? cdk.RemovalPolicy.RETAIN  // 生产环境保留
        : cdk.RemovalPolicy.DESTROY, // 开发环境可以删除
    });

    // 创建 IAM 策略允许认证用户访问 S3
    const s3Policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:PutObject'],
          resources: [
            `${audioBucket.bucketArn}/*`,
          ],
          conditions: {
            'StringEquals': {
              'cognito-identity.amazonaws.com:aud': this.userPool.userPoolId
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated'
            }
          }
        })
      ]
    });

    // 为 Lambda 添加 S3 权限
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:PutObject',
          's3:GetObject',
          's3:DeleteObject',
        ],
        resources: [
          `${audioBucket.bucketArn}/*`,
        ],
      }),
    );

    // 输出重要信息
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });

    // 输出 S3 桶信息
    new cdk.CfnOutput(this, 'AudioBucketName', {
      value: audioBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'AudioBucketArn', {
      value: audioBucket.bucketArn,
    });
  }
} 
