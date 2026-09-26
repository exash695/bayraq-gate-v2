/**
 * PM2 Production Cluster Configuration for Bayraq Gate (بوابة بيرق)
 * 
 * Usage on Production Server (VPS / Dedicated):
 * 1. Build project: npm run build
 * 2. Launch with PM2: pm2 start ecosystem.config.cjs
 * 3. Save PM2 startup list: pm2 save && pm2 startup
 * 4. Monitor cluster status: pm2 monit / pm2 status
 */

module.exports = {
  apps: [
    {
      name: "bayraq",
      script: "./dist/server.cjs",
      
      // 🚀 CLUSTER MODE: Spawn a worker process per CPU core for zero-downtime & max throughput
      instances: "max",
      exec_mode: "cluster",

      // 🛡️ Auto-Recovery & Health
      autorestart: true,
      watch: false,
      max_memory_restart: "1024M", // Automatically restart worker if memory exceeds 1GB
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,

      // ⚡ Zero-Downtime Reload Settings
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: false,

      // 📝 Environment Variables
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      },

      // 📊 Logs Configuration
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log"
    }
  ]
};
