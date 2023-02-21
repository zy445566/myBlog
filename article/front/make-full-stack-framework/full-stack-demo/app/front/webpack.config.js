const path = require('path');
module.exports = {
  mode:'development',
  entry: './src/index.jsx',
  output: {
    path: path.join(__dirname,'static'),
    filename: 'webpack.bundle.js'
  },
  resolve: {
    alias: {
        '@': path.join(__dirname,'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.m?jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          }
        }
      }
    ]
  }
};