const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const baseConfig = {
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/static/',
    libraryTarget: 'umd',
    library: ['starengine']
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    }),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        query: {
          presets:['es2015']
        },
        include: __dirname
      },
      {
        test: /\.json$/,
        loader: 'json',
        include: __dirname
      }
    ]
  },
  externals: {},
  devServer: {
    contentBase: path.join(__dirname, 'static'),
    historyApiFallback: true,
    host: "0.0.0.0",
    port: "3000",
    stats: {
      colors: true,
      hash: false,
      version: false,
      timings: false,
      assets: true,
      chunks: false,
      modules: false,
      reasons: false,
      children: false,
      source: false,
      errors: true,
      errorDetails: true,
      warnings: true
    }
  }
}

const productionConfig = Object.assign({}, baseConfig, {
  entry: { 
    "star-engine": './source/star-engine.js',
  },
  plugins: baseConfig.plugins.concat([
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      output: {
        comments: false,
      },
    })
  ]),
})

const configs = {

  production: productionConfig,

  development: Object.assign({}, baseConfig, {
    plugins: baseConfig.plugins.concat([
      new webpack.ProvidePlugin({
            Promise: 'imports?this=>global!exports?global.Promise!es6-promise'
      }),
    ]),
    devtool: 'inline-source-map',
    entry: { 
//      "star-engine": './source/star-engine.js',
      "n-body": './source/n-body.js', 
      "bouncing-balls": './source/bouncing-balls.js', 
      "asteroids": './source/asteroids.js',
    },
  }),
}

const env = process.env.NODE_ENV;

module.exports = configs[env];
