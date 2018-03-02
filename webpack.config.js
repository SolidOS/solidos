const path = require('path')
const webpack = require('webpack')
const MinifyPlugin = require('babel-minify-webpack-plugin')

module.exports = (env) => {
  const development = env === 'development'

  return [

    {
      mode: "development",
      entry: [
        './index.js'
      ],
      output: {
        path: path.join(__dirname, '/dist/'),
        publicPath: '/dist/',
        filename: 'mashlib.js',
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
          // new MinifyPlugin({ deadcode: false })
      ],

      externals: {
        'fs': 'null',
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
    },

    {
      mode: "production",
      entry: [
        './index.js'
      ],
      output: {
        path: path.join(__dirname, '/dist/'),
        publicPath: '/dist/',
        filename: 'mashlib.min.js',
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
        new MinifyPlugin({ deadcode: false })
      ],
      externals: {
        'fs': 'null',
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

  ]
}
