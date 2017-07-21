var path = require('path')

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
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  externals: {
    'node-fetch': 'fetch',
    'isomorphic-fetch': 'fetch',
    'xmldom': 'window',
    'xmlhttprequest': 'XMLHttpRequest',
    'xhr2': 'XMLHttpRequest',
    'text-encoding': 'TextEncoder',
    'urlutils': 'URL',
    '@trust/webcrypto': 'crypto',
    'webcrypto': 'crypto'
  },
  devtool: 'source-map'
}
