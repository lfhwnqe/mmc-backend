# 系统架构

## 整体架构
MMC Backend 采用现代化的云原生微服务架构，基于 AWS 服务构建：

### 核心组件
- **API 层**：AWS API Gateway + Lambda (Serverless)
- **计算层**：NestJS 应用运行在 Lambda 函数中
- **存储层**：S3 (文件) + DynamoDB (数据) + Upstash Vector (向量)
- **CDN 层**：CloudFront 全球分发
- **认证层**：AWS Cognito 用户池

## 模块架构

### 核心模块路径
```
src/modules/
├── auth/                    # 用户认证和权限管理
│   ├── auth.service.ts     # AWS Cognito 集成
│   ├── auth.controller.ts  # 认证 API 端点
│   └── guards/admin.guard.ts # 管理员权限守卫
├── ai/                     # AI 服务集成
│   ├── ai.controller.ts    # AI API 端点（故事生成、RAG聊天）
│   └── ai.service.ts       # AI 服务逻辑
├── rag/                    # 检索增强生成
│   ├── rag.service.ts      # 向量数据库操作
│   └── rag.controller.ts   # RAG API 端点
├── audio/                  # 音频文件管理
│   └── audio.service.ts    # S3 音频操作
├── audio-scene/            # 音频场景管理
│   └── audio-scene.service.ts # DynamoDB 场景数据
├── image/                  # 图像文件管理
│   └── image.service.ts    # S3 图像操作
└── health/                 # 健康检查
    └── health.controller.ts # 系统状态监控
```

### Mastra AI 框架集成
```
src/mastra/
├── index.ts                # Mastra 实例管理
├── agents/
│   ├── index.ts           # 故事生成 Agent
│   └── rag-agent.ts       # RAG 增强 Agent
├── tools/
│   └── rag-tool.ts        # RAG 检索工具
└── workflows/
    └── index.ts           # 工作流定义
```

## 基础设施架构

### CDK 基础设施代码
```
infrastructure/lib/auth-stack.ts
```

### 关键 AWS 资源
1. **Lambda 函数**
   - 主应用函数（NestJS）
   - 流式测试函数
   - ARM64 架构，Node.js 22.x

2. **API Gateway**
   - REST API 路由
   - CORS 配置
   - 请求/响应转换

3. **存储资源**
   - S3: 音频和图像文件存储
   - DynamoDB: 音频场景数据
   - Upstash Vector: 向量嵌入存储

4. **CDN 和缓存**
   - CloudFront 分发
   - Origin Access Identity (OAI)
   - 缓存策略优化

5. **用户管理**
   - Cognito 用户池
   - 管理员组配置
   - JWT 令牌验证

## 数据流架构

### 故事生成流程
1. 用户请求 → API Gateway → Lambda
2. 认证中间件验证用户
3. AI Controller 调用 Mastra Agent
4. OpenRouter API 生成故事内容
5. 流式响应返回给用户

### RAG 查询流程
1. 用户查询 → API Gateway → Lambda
2. RAG Service 生成查询向量
3. Upstash Vector 执行相似度搜索
4. RAG Agent 结合检索结果生成回答
5. 流式响应返回给用户

### 文件上传流程
1. 客户端请求预签名 URL
2. 直接上传到 S3
3. CloudFront 缓存和分发
4. 场景信息存储到 DynamoDB

## 关键设计模式

### 1. 依赖注入
- NestJS 内置 IoC 容器
- ConfigService 统一配置管理
- 模块化服务组织

### 2. 中间件模式
- AuthMiddleware 全局认证
- 异常过滤器统一错误处理
- 响应拦截器标准化输出

### 3. 适配器模式
- Serverless Express 适配器
- 多种 AI 提供商接口统一

### 4. 流式处理
- Server-Sent Events (SSE) 实时响应
- Lambda Response Streaming
- 异步迭代器处理

## 环境隔离
- **开发环境**：dev 前缀资源
- **生产环境**：prod 前缀资源
- **配置分离**：环境变量动态加载
- **数据隔离**：独立的数据库和存储桶