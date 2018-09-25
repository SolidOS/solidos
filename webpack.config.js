const path = require('path')
const webpack = require('webpack')
const MinifyPlugin = require('babel-minify-webpack-plugin')

module.exports = (env, args) => {
  const production = args.mode === 'production';
  return {
    mode: args.mode || 'development',
    entry: [
      './index.js'
    ],
    output: {
      path: path.join(__dirname, '/dist/'),
      publicPath: '/dist/',
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
        }
      ]
    },

    plugins: [
      new webpack.DefinePlugin({ 'global.IS_BROWSER': true }),
    ],

    optimization: {
      minimizer: [
        new MinifyPlugin({ deadcode: false }),
      ]
    },

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
