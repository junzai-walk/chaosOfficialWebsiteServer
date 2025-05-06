#!/bin/bash

# 部署脚本 - Chaos Website 后端服务 (MySQL版本)
# 使用方法: ./deploy.sh <服务器用户名> [--no-build]

# 检查参数
if [ -z "$1" ]; then
  echo "错误: 请提供服务器用户名"
  echo "使用方法: ./deploy.sh <服务器用户名> [--no-build]"
  echo "选项:"
  echo "  --no-build    跳过构建步骤，直接部署源代码"
  exit 1
fi

SERVER_USER=$1
SERVER_IP="175.178.87.16"
SERVER_PATH="/var/www/site/node"
BUILD_MODE=true

# 检查是否跳过构建
if [ "$2" = "--no-build" ]; then
  BUILD_MODE=false
fi

echo "开始部署 Chaos Website 后端服务到 $SERVER_IP..."

# 1. 安装依赖
echo "安装依赖..."
npm install

# 2. 构建项目（如果需要）
if [ "$BUILD_MODE" = true ]; then
  echo "打包项目..."
  npm run build
fi

# 3. 创建远程目录（如果不存在）
echo "创建远程目录..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH"

# 4. 复制项目文件到服务器
if [ "$BUILD_MODE" = true ]; then
  echo "复制打包文件到服务器..."
  scp ./dist/server.bundle.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/
  scp ./.env $SERVER_USER@$SERVER_IP:$SERVER_PATH/
  scp ./package.json $SERVER_USER@$SERVER_IP:$SERVER_PATH/

  # 创建启动脚本
  echo "创建启动脚本..."
  ssh $SERVER_USER@$SERVER_IP "cat > $SERVER_PATH/start.sh << 'EOF'
#!/bin/bash
cd \"\$(dirname \"\$0\")\"
NODE_ENV=production node server.bundle.js
EOF
chmod +x $SERVER_PATH/start.sh"
else
  echo "复制项目文件到服务器..."
  rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

  # 在服务器上安装依赖
  echo "在服务器上安装依赖..."
  ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && npm install --production"
fi

# 5. 使用PM2启动或重启应用
echo "启动应用..."
if [ "$BUILD_MODE" = true ]; then
  ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && \
    if pm2 list | grep -q 'chaos-website'; then \
      pm2 restart chaos-website; \
    else \
      pm2 start server.bundle.js --name 'chaos-website'; \
      pm2 save; \
    fi"
else
  ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && \
    if pm2 list | grep -q 'chaos-website'; then \
      pm2 restart chaos-website; \
    else \
      pm2 start server.js --name 'chaos-website'; \
      pm2 save; \
    fi"
fi

echo "部署完成！"
echo "你可以通过以下URL访问API:"
echo "https://$SERVER_IP:8888/site/node"
echo "https://$SERVER_IP:8888/site/node/contact/test"
echo "https://$SERVER_IP:8888/site/node/cooperation/test"
