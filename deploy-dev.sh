#!/bin/bash
set -e

echo "========== MMC 后端开发环境部署脚本 ==========="

# 检查.env.development文件是否存在
if [ ! -f ".env.development" ]; then
  echo "错误: .env.development 文件不存在!"
  echo "请创建 .env.development 文件并添加必要的环境变量"
  exit 1
fi

echo "从 .env.development 创建 .env 文件..."
cp .env.development .env

# 从.env文件中加载环境变量
echo "加载环境变量..."
source .env

# 确认关键环境变量已设置
if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "警告: OPENROUTER_API_KEY 环境变量未设置! Storytelling功能将无法正常工作."
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "警告: OPENAI_API_KEY 环境变量未设置! RAG功能将无法正常工作."
fi

# 导出环境变量确保构建过程可用
export OPENROUTER_API_KEY
export OPENAI_API_KEY
export OPENROUTER_BASE_URL=${OPENROUTER_BASE_URL:-"https://openrouter.ai/api/v1"}
export UPSTASH_VECTOR_URL
export UPSTASH_VECTOR_TOKEN

echo "环境变量已设置:"
echo "- OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:0:5}... (已隐藏完整key)"
echo "- OPENAI_API_KEY: ${OPENAI_API_KEY:0:5}... (已隐藏完整key)"
echo "- OPENROUTER_BASE_URL: $OPENROUTER_BASE_URL"

# 构建流程
echo "开始构建..."
echo "1. 构建Lambda层..."
yarn build:layer

echo "2. 构建Lambda函数..."
yarn build:lambda

echo "3. 部署CDK堆栈..."
cd infrastructure && yarn cdk:deploy:dev

echo "========== 部署完成 ==========="
echo "请检查AWS控制台确认部署状态" 