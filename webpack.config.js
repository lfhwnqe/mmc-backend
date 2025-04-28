const path = require('path');
const webpack = require('webpack');

module.exports = function (options) {
  return {
    ...options,
    entry: ['./src/lambda.ts'],
    externals: ['@libsql', 'libsql', '@libsql/client', '@libsql/hrana-client'],
    output: {
      ...options.output,
      filename: 'lambda.js',
      libraryTarget: 'commonjs2',
    },
    module: {
      rules: [
        // 忽略 .md 文件
        {
          test: /\.md$/,
          use: 'null-loader',
        },
        // 忽略 .d.ts 文件
        {
          test: /\.d\.ts$/,
          use: 'null-loader',
        },
        // 忽略 LICENSE 文件
        {
          test: /LICENSE$/,
          use: 'null-loader',
        },
        // 忽略 .node 二进制文件
        {
          test: /\.node$/,
          use: 'null-loader',
        },
        // 处理 .ts 文件
        {
          test: /\.ts$/, // 匹配 .ts 文件
          use: 'ts-loader', // 使用 ts-loader 处理
          exclude: /node_modules/, // 排除 node_modules 目录
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'], // 支持 .ts 和 .js 文件扩展名
      alias: {
        src: path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/microservices/microservices-module',
            '@nestjs/websockets/socket-module',
            'cache-manager',
          ];
          return lazyImports.includes(resource);
        },
      }),
    ],
  };
};
