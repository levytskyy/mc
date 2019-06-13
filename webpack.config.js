const webpack = require('webpack')
const path = require('path')
const dotenv = require('dotenv').config()

module.exports = {
  mode: "development",
  entry: [
    "./dist/scater/ButtonWebView.js",
  ],
  output: {
    path: path.join(__dirname, './dist/browser'),
    filename: "main_bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        include: [
          '/node_modules/universal-authenticator-library',
        ],
        use: ["babel-loader"]
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'EXAMPLE_ENV': {
        'CHAIN_ID': JSON.stringify(process.env.CHAIN_ID),
        'RPC_PROTOCOL': JSON.stringify(process.env.RPC_PROTOCOL),
        'RPC_HOST': JSON.stringify(process.env.RPC_HOST),
        'RPC_PORT': JSON.stringify(process.env.RPC_PORT)
      }
    })
  ]
}
