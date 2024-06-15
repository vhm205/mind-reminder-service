module.exports = {
  apps: [
    {
      name: 'mind-reminder',
      script: 'dist/main.js',
      // instances: 6,
      // exec_mode: 'cluster',
      env: {
        PORT: 2005,
        NODE_ENV: 'production',
        API_VERSION: 1,
      },
    },
  ],
};
