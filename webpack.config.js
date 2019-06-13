const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, args) => {
  const production = args.mode === 'production';
  return {
    mode: args.mode || 'development',
    entry: [
      './src/index.js'
    ],
    output: {
      path: path.join(__dirname, '/dist/'),
      publicPath: '/',
      filename: production ? 'mashlib.min.js' : 'mashlib.js',
      library: 'Mashlib',
      libraryTarget: 'umd'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /^.*\/solid-app-set\/.*\.js$/,
          loader: 'babel-loader'
        },
        {
          test: /\.scss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: process.env.NODE_ENV === 'development',
              },
            },
            'css-loader',
            'sass-loader'
          ],
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: process.env.NODE_ENV === 'development',
              },
            },
            'css-loader'
          ],
        },
        {
          test: /\.(eot|ttf|woff2?)$/i,
          loader: 'file-loader'
        },
        {
          test: /\.(png|jpg|gif|svg)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192,
              },
            },
          ],
        },
      ]
    },

    plugins: [
      new webpack.DefinePlugin({ 'global.IS_BROWSER': true }),
      new HtmlWebpackPlugin({
        title: 'Solid Data Browser',
        template: './src/index.html'
      }),
      new MiniCssExtractPlugin({})
    ],

    externals: {
      'fs': 'null',
      'node-fetch': 'fetch',
      'isomorphic-fetch': 'fetch',
      'xmldom': 'window',
      'text-encoding': 'TextEncoder',
      'whatwg-url': 'window',
      '@trust/webcrypto': 'crypto'
    },
    devtool: 'source-map'
  }
}
