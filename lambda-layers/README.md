# Lambda Layers 构建指南

本目录包含用于构建 AWS Lambda Layers 的文件，特别是为 ARM64 架构（AWS Graviton2）优化的层。

## 目录结构

```
lambda-layers/
├── build-layer.sh          # 主构建脚本
├── libsql/                 # libsql 层的构建文件
│   ├── Dockerfile          # 构建环境的 Docker 定义
│   └── package.json        # 层依赖定义
└── README.md               # 本文档
```

## 构建 Lambda Layer

### 前提条件

- 安装 Docker
- Docker 需要支持 ARM64 架构（在 Apple Silicon Mac 上原生支持，在 x86 机器上通过 QEMU 模拟）
- 安装 AWS CLI（用于可选的手动上传）

### 自动构建步骤

1. 在项目根目录运行：

```bash
yarn build:layer
```

2. 脚本将：
   - 检查 Docker 是否安装
   - 为 libsql 层构建 Docker 镜像
   - 在 Docker 容器中安装依赖
   - 将层文件打包为 ZIP
   - 从容器中复制 ZIP 文件
   - 清理临时容器和镜像

3. 构建完成后，生成的层文件 `libsql-layer.zip` 将位于 `lambda-layers` 目录中

### 部署

构建层后，可以使用以下命令部署（同时构建层和 Lambda 函数）：

```bash
# 开发环境
yarn deploy:dev:with-layer

# 生产环境
yarn deploy:prod:with-layer
```

## 手动上传层（可选）

如需手动上传层到 AWS Lambda：

```bash
aws lambda publish-layer-version \
  --layer-name libsql-layer \
  --zip-file fileb://lambda-layers/libsql-layer.zip \
  --compatible-runtimes nodejs22.x \
  --compatible-architectures arm64
```

## 自定义层

要创建新的层：

1. 创建新目录，例如 `lambda-layers/my-new-layer/`
2. 添加 `Dockerfile` 和 `package.json` 文件（参照 libsql 目录）
3. 更新 `build-layer.sh` 脚本以包含新层的构建步骤 