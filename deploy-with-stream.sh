#!/bin/bash

set -e

# u83b7u53d6u73afu5883u53c2u6570uff0cu9ed8u8ba4u4e3a 'dev'
ENV="${1:-dev}"

ECHO_PREFIX="\033[1;36m[Stream Deploy - $ENV]\033[0m"

echo -e "$ECHO_PREFIX u5f00u59cbu90e8u7f72u4e00u952eu6784u5efau548cu90e8u7f72..."

# u786eu4fddu6211u4eecu5728u6839u76eeu5f55
cd "$(dirname "$0")"

# u4f7fu7528u5b8cu6574u8defu5f84u6307u5411 mmc-stream u9879u76ee
MMC_STREAM_PATH="/Users/linuo/codes/mmc/mmc-stream"
MMC_BACKEND_PATH="/Users/linuo/codes/mmc/mmc-backend"

# u7b2cu4e00u6b65: u6784u5efa mmc-stream u9879u76ee
echo -e "$ECHO_PREFIX u6b63u5728u6784u5efa mmc-stream u9879u76ee..."
cd "$MMC_STREAM_PATH"

# u521bu5efau4e00u4e2au4e34u65f6u76eeu5f55u6765u5b58u653eu6784u5efau7ed3u679c
MIGRATION_DIR="$MMC_BACKEND_PATH/dist/stream-lambda"
rm -rf "$MIGRATION_DIR"
mkdir -p "$MIGRATION_DIR"

# u6784u5efa NestJS u9879u76ee (u9ed8u8ba4 lambda.ts)
yarn build

# u590du5236 Lambda u5904u7406u7a0bu5e8fu5230u90e8u7f72u76eeu5f55
echo -e "$ECHO_PREFIX u590du5236 Lambda u6587u4ef6u5230u90e8u7f72u76eeu5f55..."
cp -r "$MMC_STREAM_PATH/dist/lambda.js" "$MIGRATION_DIR/index.js"

# u590du5236u7eaf JS u7684u6d41u5f0fu5904u7406u7a0bu5e8f
cp -r "$MMC_STREAM_PATH/src/stream-handler/index.js" "$MIGRATION_DIR/"

# u68c0u67e5u6587u4ef6u662fu5426u5df2u7ecfu590du5236
echo -e "$ECHO_PREFIX u68c0u67e5u6d41u5f0f Lambda u6587u4ef6..."
ls -la "$MIGRATION_DIR"

# u8fd4u56deu5230 mmc-backend u9879u76ee
cd "$MMC_BACKEND_PATH"

# u7b2cu4e8cu6b65: u90e8u7f72 Lambda u51fdu6570
echo -e "$ECHO_PREFIX u5f00u59cbu90e8u7f72 AWS Lambda u51fdu6570..."
cd "$MMC_BACKEND_PATH/infrastructure"

echo -e "$ECHO_PREFIX u4f7fu7528 Node u73afu5883: $ENV"
NODE_ENV=$ENV yarn cdk deploy

echo -e "$ECHO_PREFIX u90e8u7f72u5b8cu6210uff01"
