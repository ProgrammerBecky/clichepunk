export default {
  buildOptions: {
    baseUrl: '/clichepunk',
  },
  optimize: {
    bundle: true,
    minify: false,
    target: 'es2018',
  },
  plugins: [
    [
      '@snowpack/plugin-webpack',
      {
        htmlMinifierOptions: false,
        collapseWhitespace: false,
        removeComments: false,
        removeEmptyAttributes: false,
        removeRedundantAttributes: false,
        removeScriptTypeAttributes: false,
        removeStyleLinkTypeAttributes: false,
        extendConfig: (config) => {
          config.plugins.push(/* ... */);
          return config;
        },
      },
    ],
  ],
};