# 环境变量配置指南

## 必要的API密钥

为了确保应用程序在AWS Lambda环境中正常运行，需要设置以下API密钥：

### OpenAI API Key

用于RAG服务和其他需要AI嵌入的功能。

**环境变量名称**: `OPENAI_API_KEY`

**获取方式**:
1. 登录 [OpenAI平台](https://platform.openai.com/)
2. 进入API Keys页面
3. 创建新的API Key
4. 复制API Key值

### OpenRouter API Key

用于访问多种AI模型，特别是用于Storytelling Agent。

**环境变量名称**: `OPENROUTER_API_KEY` 或 `OPEN_ROUTER_KEY`

**获取方式**:
1. 登录 [OpenRouter](https://openrouter.ai/)
2. 创建一个API密钥
3. 复制API Key值

## 部署前的环境变量设置

在部署CDK堆栈前，需要在开发环境中设置这些环境变量。可以通过以下方式实现：

### Linux/MacOS

```bash
export OPENAI_API_KEY=您的OpenAI密钥
export OPEN_ROUTER_KEY=您的OpenRouter密钥
```

### Windows命令提示符

```cmd
set OPENAI_API_KEY=您的OpenAI密钥
set OPEN_ROUTER_KEY=您的OpenRouter密钥
```

### Windows PowerShell

```powershell
$env:OPENAI_API_KEY = "您的OpenAI密钥"
$env:OPEN_ROUTER_KEY = "您的OpenRouter密钥"
```

## 常见问题

### Lambda中API密钥无法工作

如果在Lambda中遇到以下错误：

```
You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password.
```

**解决方案**:

1. 确认您已经在部署前设置了环境变量
2. 检查在`auth-stack.ts`中是否正确传递了这些环境变量给Lambda函数
3. 确认Lambda函数的环境变量已正确配置（可以在AWS控制台中Lambda函数的"配置"选项卡下查看）

### 环境变量已配置但仍然报错

这可能是由于Mastra框架的初始化顺序问题导致的。解决方法：

1. 在`rag.service.ts`中，确保将OpenAI API密钥显式地设置为环境变量：
   ```typescript
   constructor(private configService: ConfigService) {
     this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
     
     if (this.openaiApiKey) {
       // 确保环境变量被设置，因为一些库可能直接从环境变量读取
       process.env.OPENAI_API_KEY = this.openaiApiKey;
     }
   }
   ```

2. 在使用OpenAI库之前检查并设置环境变量，例如：
   ```typescript
   if (!process.env.OPENAI_API_KEY && this.openaiApiKey) {
     process.env.OPENAI_API_KEY = this.openaiApiKey;
   }
   ```

## 本地测试

为了在本地测试环境中方便设置这些环境变量，建议创建一个`.env.local`文件（确保已添加到`.gitignore`中），并使用`dotenv`包加载它：

```bash
# .env.local
OPENAI_API_KEY=您的OpenAI密钥
OPEN_ROUTER_KEY=您的OpenRouter密钥
```

然后在应用程序启动时加载：

```typescript
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
``` 