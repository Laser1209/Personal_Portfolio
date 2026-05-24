const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  entry: './src/index.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.[contenthash:8].js', clean: true },
  module: { rules: [
    { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] }
  ]},
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
  devServer: { port: 3005, hot: true, open: true }
};