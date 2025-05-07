# Chaos Website 后端服务

这是Chaos官方网站的后端服务，提供联系表单和合作意向表单的API。

## 技术栈

- Node.js
- Express
- MySQL
- Sequelize

## 项目结构

```
chaos-website-server/
├── config/             # 配置文件
│   └── db.js           # 数据库连接配置
├── models/             # 数据模型
│   └── Contact.js      # 联系人模型
├── routes/             # API路由
│   ├── contactRoutes.js    # 联系表单路由
│   └── cooperationRoutes.js # 合作意向表单路由
├── .env                # 环境变量
├── .babelrc            # Babel配置
├── webpack.config.js   # Webpack配置
├── deployment-guide.md # 部署指南
├── deploy.sh           # 部署脚本
├── ecosystem.config.js # PM2配置
├── package.json        # 项目依赖
├── README.md           # 项目说明
└── server.js           # 服务器入口文件
```

## 本地开发

### 前提条件

- Node.js (v14.x 或更高版本)
- MySQL (v5.7 或更高版本)

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建或编辑 `.env` 文件:

```
PORT=5000
NODE_ENV=development
TZ=Asia/Shanghai

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chaos_website_dev
DB_USER=root
DB_PASSWORD=password
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:5000 上运行。

## API 端点

### 联系表单

- `GET /contact/test` - 测试联系表单API
- `POST /contact` - 提交联系表单

### 合作意向表单

- `GET /cooperation/test` - 测试合作意向表单API
- `POST /cooperation` - 提交合作意向表单

## 打包

项目支持使用webpack打包，将所有代码打包成单一文件，便于部署：

```bash
# 安装依赖
npm install

# 打包项目
npm run build
```

打包完成后，会在`dist`目录下生成`server.bundle.js`文件。

## 部署

详细的部署指南请参考 [deployment-guide.md](./deployment-guide.md)。

### 快速部署

使用部署脚本:

```bash
# 打包并部署
chmod +x deploy.sh
./deploy.sh <服务器用户名>

# 不打包，直接部署源代码
./deploy.sh <服务器用户名> --no-build
```

## 许可证

ISC
