FROM --platform=linux/arm64 public.ecr.aws/sam/build-nodejs22.x:latest

WORKDIR /var/task

# 复制package.json文件
COPY package.json .

# 创建正确的目录结构
RUN mkdir -p /opt/nodejs/node_modules

# 安装依赖到node_modules目录
RUN npm install

# 复制依赖到Layer正确的目录结构中
RUN cp -r node_modules/* /opt/nodejs/node_modules/

# 打包为zip文件
RUN cd /opt && zip -r /var/task/libsql-layer.zip nodejs 