const { Sequelize } = require('sequelize');

// 创建Sequelize实例
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+08:00', // 设置时区为东八区（北京时间）
    dialectOptions: {
      // 确保MySQL连接也使用相同的时区
      timezone: '+08:00',
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 测试数据库连接
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL数据库连接成功');

    // 同步所有模型（如果不存在则创建表）
    // 注意：在生产环境中，应该使用迁移而不是sync
    // 临时修改：允许在任何环境下同步模型，以便创建必要的表结构
    await sequelize.sync({ alter: true });
    console.log('所有模型已同步');
  } catch (error) {
    console.error('无法连接到数据库:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
