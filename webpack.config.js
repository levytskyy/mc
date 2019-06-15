const webpack = require('webpack')

module.exports = {
  mode: "development",

  module: {
      rules: [
          {
              test: /\.ts$/,
              loader: 'ts-loader'
          },
          {
              test: /\.(ts|js)$/,
              loader: 'regexp-replace-loader',
              options: {
                  match: {
                      pattern:'\\[(Mouse|Keyboard)Event\\]',
                      flags:'g'
                  },
                  replaceWith:'[]'
              }
          }
      ]
  }
}
