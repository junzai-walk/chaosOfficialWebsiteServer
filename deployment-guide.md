# 部署指南 - Chaos Website 后端服务

本指南将帮助你将 Chaos Website 后端服务部署到腾讯云服务器。

## 打包部署方式

本项目支持两种部署方式：
1. 打包后部署（推荐方式）
2. 直接部署源代码（传统方式）

## 前提条件

- 腾讯云服务器 (IP: 175.178.87.16)
- 服务器上已安装 MySQL
- 服务器上已安装 Node.js (推荐 v14.x 或更高版本)

## 部署步骤

### 1. 准备服务器环境

#### 安装 Node.js (如果尚未安装)

```bash
# 更新包列表
sudo apt update

# 安装 Node.js 和 npm
sudo apt install nodejs npm

# 安装 n 模块来管理 Node.js 版本
sudo npm install -g n

# 安装最新的稳定版 Node.js
sudo n stable

# 验证安装
node -v
npm -v
```

#### 确认 MySQL 已安装并运行

```bash
# 检查 MySQL 状态
sudo systemctl status mysql

# 如果未运行，启动 MySQL
sudo systemctl start mysql

# 设置开机自启
sudo systemctl enable mysql

# 创建数据库和用户
sudo mysql -u root -p
```

在MySQL提示符下执行以下命令：

```sql
CREATE DATABASE chaos_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chaos_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON chaos_website.* TO 'chaos_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 打包项目（推荐方式）

在本地开发环境中打包项目：

```bash
# 安装依赖
npm install

# 打包项目
npm run build
```

打包完成后，`dist` 目录下会生成 `server.bundle.js` 文件，这是一个包含了所有必要代码的单一文件。

#### 创建项目目录

```bash
# 创建目录
sudo mkdir -p /var/www/site/node

# 设置权限
sudo chown -R $USER:$USER /var/www/site/node
```

#### 传输打包文件到服务器

方法 1: 使用 SCP (从本地机器执行)

```bash
# 传输打包文件
scp ./dist/server.bundle.js user@175.178.87.16:/var/www/site/node/

# 传输环境配置文件
scp ./.env user@175.178.87.16:/var/www/site/node/

# 传输package.json (仅用于记录依赖信息)
scp ./package.json user@175.178.87.16:/var/www/site/node/
```

#### 在服务器上创建启动脚本

```bash
# 连接到服务器
ssh user@175.178.87.16

# 创建启动脚本
cat > /var/www/site/node/start.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
NODE_ENV=production node server.bundle.js
EOF

# 添加执行权限
chmod +x /var/www/site/node/start.sh
```

### 3. 部署项目（传统方式）

如果你不想使用打包方式，也可以使用传统方式部署：

#### 创建项目目录

```bash
# 创建目录
sudo mkdir -p /var/www/site/node

# 设置权限
sudo chown -R $USER:$USER /var/www/site/node
```

#### 传输项目文件到服务器

方法 1: 使用 SCP (从本地机器执行)

```bash
scp -r /path/to/local/chaos-website-server/* user@175.178.87.16:/var/www/site/node/
```

方法 2: 使用 Git

```bash
# 在服务器上
cd /var/www/site/node
git clone <your-repository-url> .
```

#### 安装依赖

```bash
cd /var/www/site/node
npm install --production
```

### 4. 配置项目

#### 设置环境变量

确保 `.env` 文件已正确配置:

```
PORT=30002
NODE_ENV=production
TZ=Asia/Shanghai

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chaos_website
DB_USER=chaos_user
DB_PASSWORD=your_secure_password
```

### 5. 使用 PM2 运行项目

PM2 是一个进程管理器，可以帮助你保持应用程序运行，并在服务器重启后自动启动。

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动应用 (打包版本)
cd /var/www/site/node
pm2 start server.bundle.js --name "chaos-website"

# 或者使用启动脚本 (打包版本)
# pm2 start /var/www/site/node/start.sh --name "chaos-website"

# 启动应用 (传统版本)
# cd /var/www/site/node
# pm2 start server.js --name "chaos-website"

# 设置开机自启
pm2 startup
pm2 save
```

### 6. 配置 Nginx 反向代理 (可选但推荐)

如果你想使用 Nginx 作为反向代理，可以按照以下步骤配置：

```bash
# 安装 Nginx
sudo apt install nginx

# 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/chaos-website
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name 175.178.87.16;

    location /site/node {
        proxy_pass http://localhost:30002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/chaos-website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 配置 HTTPS (使用 Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取并配置 SSL 证书
sudo certbot --nginx -d 175.178.87.16
```

按照提示完成 HTTPS 配置。

### 8. 测试部署

访问以下 URL 测试 API 是否正常工作：

- https://175.178.87.16:30002/site/node
- https://175.178.87.16:30002/site/node/contact/test
- https://175.178.87.16:30002/site/node/cooperation/test

## 故障排除

### 检查日志

```bash
# 查看 PM2 日志
pm2 logs chaos-website

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看 MySQL 日志
sudo tail -f /var/log/mysql/error.log
```

### 时区配置

为确保应用程序中的日期和时间正确显示，我们需要配置正确的时区：

1. **Node.js 应用时区**
   - 在 `.env` 文件中设置 `TZ=Asia/Shanghai`
   - 在 PM2 配置中添加 `TZ: 'Asia/Shanghai'`

2. **MySQL 时区**
   - 在 MySQL 配置文件 (`/etc/mysql/my.cnf`) 中添加：
     ```
     [mysqld]
     default-time-zone='+08:00'
     ```
   - 重启 MySQL 服务：`sudo systemctl restart mysql`

3. **验证时区设置**
   - 在 MySQL 中执行：`SELECT NOW();` 查看当前时间
   - 确保返回的时间与本地时间一致

### 常见问题

1. **无法连接到 MySQL**
   - 确保 MySQL 服务正在运行
   - 检查数据库连接配置是否正确
   - 确认用户名和密码是否正确
   - 确认数据库用户是否有正确的权限

2. **端口被占用**
   - 检查是否有其他服务占用了 30002 端口
   - 使用 `sudo lsof -i :30002` 查看占用端口的进程

3. **防火墙问题**
   - 确保防火墙允许 30002 端口的流量
   - 使用 `sudo ufw allow 30002/tcp` 开放端口

4. **时间显示不正确**
   - 检查应用和数据库的时区配置
   - 确保 MySQL 和 Node.js 应用使用相同的时区设置
   - 重启应用和数据库服务

## 维护

### 更新应用

```bash
cd /var/www/site/node
git pull  # 如果使用 Git 部署
npm install --production
pm2 restart chaos-website
```

### 备份数据库

```bash
# 创建备份目录
mkdir -p ~/backups

# 备份数据库
mysqldump -u chaos_user -p chaos_website > ~/backups/chaos_website_$(date +%Y-%m-%d).sql

# 恢复数据库 (如果需要)
mysql -u chaos_user -p chaos_website < ~/backups/chaos_website_YYYY-MM-DD.sql
```
