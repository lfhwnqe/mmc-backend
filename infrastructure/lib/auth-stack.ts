import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

interface AuthStackProps extends cdk.StackProps {
  stage: string; // 环境标识：dev, test, prod
  openApiConfig: {
    apiKey: string;
    apiUrl: string;
  };
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    console.log('🌹props.openaiApiKey:', props.openApiConfig.apiKey);
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
      userInvitation: {
        emailSubject: '验证您的邮箱',
        emailBody: '您好 {username}，您的验证码是 {####}',
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

    // 创建 DynamoDB 表
    const audioSceneTable = new dynamodb.Table(this, 'AudioSceneTable', {
      tableName: `audio-scene-table-${stageName}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sceneId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy:
        props.stage === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // 创建 Lambda 执行角色
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    // 添加 Cognito 权限
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:SignUp',
          'cognito-idp:InitiateAuth',
          'cognito-idp:ConfirmSignUp',
          'cognito-idp:AdminInitiateAuth',
          'cognito-idp:AdminGetUser',
          'cognito-idp:GetUser',
          'cognito-idp:UpdateUserPool',
          'cognito-idp:DescribeUserPool',
        ],
        resources: [this.userPool.userPoolArn],
      }),
    );

    // 添加 DynamoDB 权限
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:Query',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
        ],
        resources: [
          audioSceneTable.tableArn,
          `${audioSceneTable.tableArn}/index/*`,
        ],
      }),
    );

    // 创建 S3 桶
    const audioBucket = new s3.Bucket(this, 'AudioBucket', {
      bucketName: `${id}-${stageName}-audio-bucket`.toLowerCase(),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: [
            'http://localhost:3000',
            'https://en.maomaocong.site',
            'https://*.maomaocong.site',
            'http://localhost:3001',
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
      removalPolicy:
        props.stage === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // 创建图片存储桶
    const imageBucket = new s3.Bucket(this, 'ImageBucket', {
      bucketName: `${id}-${stageName}-image-bucket`.toLowerCase(),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: [
            'http://localhost:3000',
            'https://en.maomaocong.site',
            'https://*.maomaocong.site',
            'http://localhost:3001',
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
      removalPolicy:
        props.stage === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // 创建 CloudFront 分发的 OAI (Origin Access Identity)
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      'CloudFrontOAI',
      {
        comment: `OAI for ${id} ${stageName}`,
      },
    );

    // 允许 CloudFront OAI 访问音频 S3 桶
    audioBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [audioBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId,
          ),
        ],
      }),
    );

    // 允许 CloudFront OAI 访问图片 S3 桶
    imageBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [imageBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId,
          ),
        ],
      }),
    );

    // 创建 CloudFront 分发
    const distribution = new cloudfront.Distribution(
      this,
      'AudioDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(audioBucket, {
            originAccessIdentity: cloudfrontOAI,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        additionalBehaviors: {
          'images/*': {
            origin: new origins.S3Origin(imageBucket, {
              originAccessIdentity: cloudfrontOAI,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          },
        },
        enabled: true,
        comment: `Audio distribution for ${id} ${stageName}`,
        defaultRootObject: 'index.html',
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      },
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
        AUDIO_BUCKET_NAME: audioBucket.bucketName,
        IMAGE_BUCKET_NAME: imageBucket.bucketName,
        OPENAI_CONFIG: JSON.stringify({
          apiKey: props.openApiConfig.apiKey,
          apiUrl: props.openApiConfig.apiUrl,
        }),
        CLOUDFRONT_DOMAIN: distribution.distributionDomainName,
      },
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
    });

    // 创建 API Gateway 日志角色
    const apiGatewayLoggingRole = new iam.Role(this, 'ApiGatewayLoggingRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        ),
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
          }),
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
      anyMethod: true, // 允许所有 HTTP 方法
    });

    // 创建 IAM 策略允许认证用户访问 S3
    const s3Policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:PutObject'],
          resources: [`${audioBucket.bucketArn}/*`],
          conditions: {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': this.userPool.userPoolId,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
        }),
      ],
    });

    // 为 Lambda 添加 S3 权限
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
        resources: [`${audioBucket.bucketArn}/*`, `${imageBucket.bucketArn}/*`],
      }),
    );

    // 在 userPool 创建后添加
    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admin',
      description: 'Administrator group with full access',
    });

    // 给 Lambda 添加管理用户组的权限
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:ListUsers',
          'cognito-idp:ListGroups',
        ],
        resources: [this.userPool.userPoolArn],
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

    new cdk.CfnOutput(this, 'ImageBucketName', {
      value: imageBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'ImageBucketArn', {
      value: imageBucket.bucketArn,
    });
    // 添加 CloudFront 相关输出
    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
    });
  }
}
