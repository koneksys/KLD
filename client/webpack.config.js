'use strict';

let path = require('path'),
  webpack = require('webpack'),
  autoprefixer = require('autoprefixer-core'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  ExtractTextPlugin = require('extract-text-webpack-plugin'),
  BUILD = process.env.BUILD !== undefined ? true : false,
  PROFILE = process.env.PROFILE !== undefined ? process.env.PROFILE : 'default',
  config = {}, cssLoader;

console.log('PROFILE = ', PROFILE);

config.entry = {app: './src/' + PROFILE + '/app.js'};
config.output = {
  path: './asset.' + PROFILE,
  publicPath: BUILD ? '/' : '/',
  filename: BUILD ? '[name].[hash].js' : '[name].bundle.js',
  chunkFilename: BUILD ? '[name].[hash].js' : '[name].bundle.js'
};

console.log('config.output', config.output);

config.module = {
  preLoaders: [],
  loaders: [{
    test: /(bootstrap\/js\/)/,
    loader: 'imports?jQuery=jquery'
  }, {
    test: /\.json$/,
    loader: 'json-loader'
  }, {
    test: /\.js$/,
    loader: 'babel?optional=runtime',
    presets: ['es2015'],
    exclude: /(node_modules|bower_components|bootstrap.config.js|angular-file-upload.js.map)/
  }, {
    test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|txt)$/,
    loader: 'file'
  }, {
    test: /\.less$/,
    loader: 'style!css!less'
  }, {
    test: /\.scss$/,
    loaders: ['style', 'css', 'sass']
  }, {
    test: /(\.html|\.txt)$/,
    loader: 'raw'
  }, {
    test: /(\.jsx|\.js)$/,
    loader: 'eslint-loader',
    exclude: /(node_modules|bower_components|bootstrap.config.js|crypto.aes.js|angular-file-upload.js.map)/
  }]
};

cssLoader = {
  test: /\.css$/,
  loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss')
};

config.module.loaders.push(cssLoader);
config.postcss = [
  autoprefixer({
    browsers: ['last 2 version']
  })
];

config.plugins = [
  new ExtractTextPlugin('[name].[hash].css', {
    disable: true
  }),
  new webpack.ProvidePlugin({
      "$": "jquery",
      "jQuery": "jquery"
  })
];

config.plugins.push(
  new HtmlWebpackPlugin({
    template: './src/index.html',
    inject: 'body',
    minify: false
  })
);

if (BUILD) {
  config.plugins.push(
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  );
}

config.devServer = {
  contentBase: './asset.' + PROFILE,
  stats: {
    modules: true,
    cached: true,
    colors: true,
    chunk: true
  }
};

module.exports = config;
