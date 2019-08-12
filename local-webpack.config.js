const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');


module.exports = (env, args) => {
  const production = args.mode === 'production';
  return {
    mode: args.mode || 'development',
    entry: [
      './src/index.ts'
    ],
    output: {
      path: path.join(__dirname, '/dist/'),
      publicPath: '/',
      filename: production ? 'mashlib.min.js' : 'mashlib.js',
      library: 'Mashlib',
      libraryTarget: 'umd'
    },
    resolve: {
      extensions: ['.js', '.ts'],
      alias: {
        'rdflib': '/devel/github.com/linkeddata/rdflib.js',
        'solid-ui': '/devel/github.com/solid/solid-ui/',
        'solid-panes': '/devel/github.com/solid/solid-panes/'
        '// chat-pane': '../../solid/chat-pane'
      }
    },
    module: {
      rules: [
        {
          test: /\.(mjs|js|ts)$/,
          exclude: /(bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
             compact: false
            }
          }
        },
        {
          test: /^.*\/solid-panes\/.*\.js$/,
          loader: 'babel-loader',
          options: {
           compact: false
          }
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
      new MiniCssExtractPlugin({}),
      new ForkTsCheckerWebpackPlugin(),

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
