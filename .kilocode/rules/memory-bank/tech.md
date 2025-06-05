# 技术栈和开发环境

## 核心技术栈

### 后端框架
- **NestJS 10.x**：TypeScript 企业级框架
- **Node.js 22.x**：运行时环境
- **TypeScript 5.x**：类型安全编程语言

### AI 和机器学习
- **Mastra Framework 0.8.x**：AI 工作流和代理管理
- **@openrouter/ai-sdk-provider**：多模型 AI 接口
- **@ai-sdk/openai**：OpenAI 官方 SDK
- **@langchain/community**：语言链工具库
- **@upstash/vector**：向量数据库客户端

### AWS 云服务集成
- **@aws-sdk/client-cognito-identity-provider**：用户认证
- **@aws-sdk/client-s3**：对象存储
- **@aws-sdk/client-dynamodb**：NoSQL 数据库
- **@aws-sdk/client-lambda**：无服务器计算
- **@aws-sdk/s3-request-presigner**：预签名 URL

### 服务器和部署
- **@vendia/serverless-express**：Lambda 适配器
- **aws-cdk-lib**：基础设施即代码
- **aws-lambda**：无服务器函数

### 数据验证和转换
- **class-validator**：DTO 验证
- **class-transformer**：对象转换
- **zod**：Schema 验证库

### 工具和实用程序
- **uuid**：唯一标识符生成
- **cookie-parser**：Cookie 解析
- **aws-jwt-verify**：JWT 令牌验证

## 开发工具

### 构建和打包
- **webpack 5.x**：模块打包器
- **ts-loader**：TypeScript 加载器
- **null-loader**：文件忽略加载器

### 代码质量
- **ESLint**：代码规范检查
- **Prettier**：代码格式化
- **TypeScript**：静态类型检查

### 测试框架
- **Jest**：单元测试框架
- **Supertest**：HTTP 断言库
- **@nestjs/testing**：NestJS 测试工具

## 环境配置

### 开发环境设置
```bash
# 依赖管理
pnpm install

# 开发服务器
pnpm start:dev

# 构建 Lambda 包
pnpm build:lambda
```

### 环境变量
```bash
# AI 服务配置
OPENROUTER_API_KEY=your_key
OPENAI_API_KEY=your_key

# 向量数据库
UPSTASH_VECTOR_URL=your_url
UPSTASH_VECTOR_TOKEN=your_token

# AWS 资源（自动注入）
USER_POOL_ID=auto_generated
USER_POOL_CLIENT_ID=auto_generated
AUDIO_BUCKET_NAME=auto_generated
IMAGE_BUCKET_NAME=auto_generated
CLOUDFRONT_DOMAIN=auto_generated
```

### 部署脚本
- **deploy-dev.sh**：开发环境部署
- **deploy-prod.sh**：生产环境部署
- **deploy-with-stream.sh**：流式响应部署

## 关键依赖版本约束

### TypeScript 配置
- **target**: ES2021
- **module**: commonjs
- **strict mode**: 部分启用
- **decorator support**: 启用

### Lambda 运行时
- **架构**: ARM64
- **运行时**: Node.js 22.x
- **内存**: 1024MB
- **超时**: 2分钟
- **日志保留**: 1周

### Webpack 配置
- **入口**: src/lambda.ts
- **输出**: dist/lambda.js
- **外部依赖**: @libsql 相关包
- **忽略文件**: .md, .d.ts, LICENSE, .node

## 开发约定

### 文件组织
- **模块化结构**：每个功能独立模块
- **分层架构**：Controller → Service → Repository
- **配置分离**：环境特定配置文件

### 命名规范
- **文件**: kebab-case
- **类**: PascalCase
- **方法**: camelCase
- **常量**: UPPER_SNAKE_CASE

### 错误处理
- **统一异常过滤器**：HttpExceptionFilter
- **响应标准化**：TransformInterceptor
- **日志记录**：NestJS Logger

## 性能优化

### Lambda 优化
- **代码分割**：Webpack 打包优化
- **依赖排除**：外部化大型依赖
- **冷启动优化**：实例缓存

### 数据库优化
- **连接池**：DynamoDB 客户端复用
- **查询优化**：分页和索引使用
- **缓存策略**：CloudFront CDN

### AI 服务优化
- **流式响应**：实时内容传输
- **模型选择**：性能与成本平衡
- **环境变量缓存**：减少配置读取