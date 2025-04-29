#!/bin/bash
set -e

echo "========== 直接测试环境变量在构建时的影响 ==========="

# 创建备份
echo "备份原始文件..."
cp src/mastra/agents/index.ts src/mastra/agents/index.ts.bak

# 获取时间戳
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "添加时间戳标记: $TIMESTAMP"

# 设置测试密钥
TEST_KEY="test_key_$(date +%s)"
echo "使用测试密钥: $TEST_KEY"

# 直接修改源文件 - 通过硬编码的方式添加测试密钥
cat > src/mastra/agents/index.ts << EOF
import { Agent } from '@mastra/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { Logger } from '@nestjs/common';

const logger = new Logger('MastraAgents');

// 添加构建时间和测试密钥标记
const buildTime = "${TIMESTAMP}";
const testKey = "${TEST_KEY}"; // 用于验证构建时嵌入
logger.log(\`Mastra Agent模块初始化时间: \${buildTime}, 测试密钥: \${testKey}\`);

// 这里使用硬编码的环境变量值，用于验证是否被webpack处理
const openRouterApiKey = testKey;
if (!openRouterApiKey) {
  logger.warn(
    \`⚠️ OpenRouter API Key未设置 (初始化时间: \${buildTime})\`,
  );
} else {
  logger.log(
    \`OpenRouter API Key已配置: \${openRouterApiKey} (初始化时间: \${buildTime})\`,
  );
}

const openrouter = createOpenRouter({
  apiKey: openRouterApiKey,
});

export const storytellingAgent = new Agent({
  name: 'Storytelling Agent',
  instructions: \`
      你是一个给小朋友讲故事的专家
      你的任务是根据小朋友的年龄和兴趣，给他们讲一个有趣的故事。
      你的故事应该包含以下元素：
      - 有趣的角色
      - 有趣的故事情节
      - 有趣的角色对话
      - 有趣的角色动作
      - 有趣的角色表情
\`,
  model: openrouter.chat('microsoft/mai-ds-r1:free'),
});
EOF

# 构建Lambda函数
echo "开始构建Lambda函数..."
rm -rf dist && yarn build:lambda

echo "构建完成"
echo "检查dist/lambda.js是否包含测试密钥..."

# 检查生成的Lambda文件是否包含测试密钥
if grep -q "$TEST_KEY" dist/lambda.js; then
  echo "成功! 在构建输出中找到了测试密钥 - 确认硬编码值被保留在构建结果中"
  echo "这意味着mastra在构建时就已经初始化，并且使用了当时的环境变量"
else
  echo "未找到测试密钥 - webpack可能优化移除了未使用的变量"
  echo "尝试检查时间戳..."
  
  if grep -q "$TIMESTAMP" dist/lambda.js; then
    echo "找到了时间戳 - 确认构建时的硬编码值被保留"
  else
    echo "未找到时间戳 - webpack可能彻底优化了这些值"
  fi
fi

# 还原备份
echo "还原原始文件..."
mv src/mastra/agents/index.ts.bak src/mastra/agents/index.ts

echo "========== 测试完成 ===========" 