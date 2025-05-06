const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node', // 指定为Node.js环境
  mode: 'production', // 生产模式，会进行代码压缩和优化
  entry: './server.js', // 入口文件
  output: {
    path: path.resolve(__dirname, 'dist'), // 输出目录
    filename: 'server.bundle.js', // 输出文件名
    clean: true // 每次构建前清理输出目录
  },
  externals: [nodeExternals()], // 排除node_modules中的依赖
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  optimization: {
    minimize: true // 启用代码压缩
  },
  node: {
    __dirname: false, // 保持__dirname的行为不变
    __filename: false // 保持__filename的行为不变
  }
};
