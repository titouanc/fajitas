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
        include: path.join(__dirname, 'src'),
        loader: 'babel-loader',
        query: {presets: ["es2015"]}
      }
    ]
  },
  debug: true,
  cache: true
};
