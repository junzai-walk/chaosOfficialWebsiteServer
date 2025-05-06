module.exports = {
  apps: [{
    name: 'chaos-website',
    script: 'server.bundle.js', // 使用打包后的文件
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 8888,
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_NAME: 'chaos_website',
      DB_USER: 'chaos_user',
      DB_PASSWORD: 'your_secure_password'
    }
  }]
};
