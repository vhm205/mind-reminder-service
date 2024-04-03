module.exports = {
  apps: [
    {
      name: 'mind-reminder',
      script: 'dist/main.js',
      instances: 6,
      exec_mode: 'cluster',
      env: {
        PORT: 2005,
        NODE_ENV: 'development',
        REDIS_URL: 'redis://127.0.0.1:6379',
        API_VERSION: 1,
        DOMAIN: 'http://localhost:2005',
      },
    },
  ],
};
