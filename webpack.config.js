module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ['./src/lambda.ts'],
    externals: [
      // 排除所有@libsql相关模块
      /^@libsql\/.*/,
      'libsql',
      // AWS SDK是Lambda环境已有的
      /^@aws-sdk\/.*/,
    ],
    output: {
      ...options.output,
      filename: 'lambda.js',
      libraryTarget: 'commonjs2',
    },
    module: {
      ...options.module,
      rules: [
        ...(options.module?.rules || []),
        {
          test: /\.md$/,
          use: 'null-loader',
        },
        {
          test: /\.d\.ts$/,
          use: 'null-loader',
        },
      ],
    },
    resolve: {
      ...options.resolve,
      fallback: {
        ...options.resolve?.fallback,
        fs: false,
        path: false,
        util: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        crypto: false,
        zlib: false,
        net: false,
        tls: false,
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
            '@libsql/isomorphic-ws',
            '@libsql/isomorphic-fetch',
          ];
          return lazyImports.includes(resource);
        },
      }),
    ],
  };
};
