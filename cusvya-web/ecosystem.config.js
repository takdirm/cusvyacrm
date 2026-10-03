module.exports = {
  apps: [
    {
      name: 'infraxadmin',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'development',
      },
      env_production: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
};
