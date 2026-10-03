const { theme, darkTheme } = require('./src/config/theme/themeVariables');

const CracoLessPlugin = require('craco-less');

module.exports = {
  devServer: {
    port: 3000,
  },
  webpack: {
    configure: (webpackConfig) => {
      // Suppress source map warnings from third-party packages
      webpackConfig.ignoreWarnings = [/Failed to parse source map/, /ENOENT: no such file or directory/];

      return {
        ...webpackConfig,
        resolve: {
          ...webpackConfig.resolve,
          fallback: {
            path: false,
          },
        },
      };
    },
    test: /\.m?jsx?$/,
    // exclude: /node_modules\/@firebase/,
    exclude: /node_modules\/@firebase\/auth/,
    ignoreWarnings: [/Failed to parse source map/],
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              ...theme,
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
  eslint: {
    enable: false,
  },
};
