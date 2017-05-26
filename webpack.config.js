var path = require('path');

module.exports = {
  entry: './src/app.js',
  output: {
      path: __dirname,
      filename: 'app.js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['es2015']
        }
      }
    ]
  },
  cache: true
};
