module.exports = {
  apps: [{
    name: "univeris",
    script: "server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    watch: true,
    autorestart: true,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
} 