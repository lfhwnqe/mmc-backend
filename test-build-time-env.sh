#!/bin/bash
set -e

echo "========== 测试环境变量在构建时的影响 ==========="

# 修改一个源代码文件，增加时间戳便于区分
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "添加时间戳标记: $TIMESTAMP"

# 将时间戳添加到mastra/agents/index.ts文件，使用JavaScript/TypeScript语法
echo -e "\n// 构建时间标记: $TIMESTAMP\nconsole.log('构建于 $TIMESTAMP');" >> src/mastra/agents/index.ts

# 设置临时环境变量
export TEST_OPENROUTER_API_KEY="test_key_$(date +%s)"
echo "设置临时测试环境变量: TEST_OPENROUTER_API_KEY=$TEST_OPENROUTER_API_KEY"

# 构建Lambda函数 - 这步应该捕获当前环境变量
echo "开始构建Lambda函数..."
rm -rf dist && OPENROUTER_API_KEY=$TEST_OPENROUTER_API_KEY nest build --webpack --webpackPath webpack.config.js

echo "构建完成"
echo "检查dist/lambda.js是否包含测试密钥..."

# 检查生成的Lambda文件是否包含测试密钥
if grep -q "$TEST_OPENROUTER_API_KEY" dist/lambda.js; then
  echo "成功! 在构建输出中找到了测试密钥 - 确认环境变量在构建时被嵌入"
else
  echo "未找到测试密钥 - 环境变量可能未在构建时被嵌入或被webpack处理"
fi

# 还原文件 - 删除添加的时间戳行
sed -i '' -e "/构建时间标记: $TIMESTAMP/d" src/mastra/agents/index.ts
sed -i '' -e "/构建于 $TIMESTAMP/d" src/mastra/agents/index.ts

echo "========== 测试完成 ===========" 