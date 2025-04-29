<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# 项目目录
src/
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── common
│   ├── decorators
│   ├── filters
│   ├── guards
│   └── interfaces
├── config
├── main.ts
└── modules

# 开发流程
> 本地开发时使用 main.ts 作为入口，连接开发环境的 AWS 资源
> Lambda 部署时使用 lambda.ts 作为入口，使用对应环境的 AWS 资源
> 环境变量会正确注入到 Lambda 中
> 开发环境和生产环境完全隔离

## 环境变量配置
在部署前，需要正确配置环境变量。项目根目录下提供了`environment-example.txt`文件作为参考。

1. 创建环境配置文件：
```shell
# 开发环境配置
cp environment-example.txt .env.development
# 生产环境配置
cp environment-example.txt .env.production
```

2. 编辑配置文件，填入相应的API密钥：
```shell
# 使用你喜欢的编辑器
nano .env.development
# 或
vim .env.production
```

3. 确保以下关键环境变量已设置：
   - `OPENROUTER_API_KEY` - 用于Storytelling功能
   - `OPENAI_API_KEY` - 用于RAG功能和向量嵌入

## 开发环境
```shell
# 使用新的部署脚本（推荐）
pnpm run deploy:dev:script

# 或者使用传统方式
# 先部署开发环境的 AWS 资源
pnpm run deploy:dev

# 本地运行开发服务器（使用 main.ts 作为入口）
pnpm start:dev
```

## 线上环境
```shell
# 使用新的部署脚本（推荐）
pnpm run deploy:prod:script

# 或者使用传统方式
# 部署生产环境的 AWS 资源
pnpm run deploy:prod
```

## 设置管理员账户
```shell
aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username USER_EMAIL \
  --group-name admin
```****
