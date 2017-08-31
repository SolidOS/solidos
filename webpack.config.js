const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: [
    './index.js'
  ],
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: 'mashlib-prealpha.js',
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
    new webpack.DefinePlugin({ 'global.IS_BROWSER': true })
    // new webpack.optimize.UglifyJsPlugin()
  ],
  externals: {
    'node-fetch': 'fetch',
    'isomorphic-fetch': 'fetch',
    'xmldom': 'window',
    'xmlhttprequest': 'XMLHttpRequest',
    'xhr2': 'XMLHttpRequest',
    'text-encoding': 'TextEncoder',
    'whatwg-url': 'window',
    '@trust/webcrypto': 'crypto',
    'webcrypto': 'crypto'
  },
  devtool: 'source-map'
}
