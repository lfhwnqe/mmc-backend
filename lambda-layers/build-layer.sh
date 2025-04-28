#!/bin/bash

# 确保脚本在错误时退出
set -e

# 检查是否安装了Docker
if ! command -v docker &> /dev/null; then
    echo "错误: 未安装Docker，请先安装Docker"
    exit 1
fi

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "脚本目录: ${SCRIPT_DIR}"

# 创建必要的目录
mkdir -p "${SCRIPT_DIR}"

# 构建libsql层
echo "开始构建libsql Lambda Layer..."
cd "${SCRIPT_DIR}/libsql"

# 构建Docker镜像
echo "构建Docker镜像..."
docker build --platform linux/arm64 -t libsql-layer-builder .

# 运行容器并提取zip文件
echo "从容器中提取层文件..."
docker run --platform linux/arm64 --name libsql-layer-container libsql-layer-builder
docker cp libsql-layer-container:/var/task/libsql-layer.zip ../libsql-layer.zip
docker rm libsql-layer-container

echo "清理Docker镜像..."
docker rmi libsql-layer-builder

echo "构建完成! 生成的层文件: libsql-layer.zip"
cd "${SCRIPT_DIR}"

# 打印完成消息
echo "ARM64 Lambda Layer 构建完成!"
echo "您可以在 AWS CDK 中使用这个层文件" 