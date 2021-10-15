const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: "./jssrc/index.js",
    module: {
        rules: [
          {
            test: /\.vue$/,
            loader: 'vue-loader',
          },
          {
            test: /\.ts?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
          {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
          },
          {
            test: /\.less$/,
            use: [
              'vue-style-loader',
              {
                loader: 'css-loader',
                options: { esModule: false },
              },
              {
                loader: 'less-loader',
                options: {
                  lessOptions: {
                    javascriptEnabled: true,
                  },
                },
              },
              // MiniCssExtractPlugin.loader,
            ],
          },
          {
            test: /\.js$/i,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: {
                        browsers: 'chrome > 70',
                      },
                    },
                  ],
                ],
                plugins: [
                  [
                    'import',
                    {
                      libraryName: 'ant-design-vue',
                      libraryDirectory: 'es',
                      style: 'css',
                    },
                  ],
                ],
              },
            },
          },
        ],
    },
    mode: 'development',
    devtool: 'inline-source-map',
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.json', '.vue'],
      alias: {
        'webcodec-push-sdk': path.resolve(__dirname, 'index.js'),
      }
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webcodec-push-sdk-webpack.bundle.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
          template: './index.html',
          excludeChunks: ['client'],
        }),
    ],
    node: {
        fs: 'empty',
    }
};