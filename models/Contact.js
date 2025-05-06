const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  wish: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  tableName: 'contacts'
});

module.exports = Contact;
