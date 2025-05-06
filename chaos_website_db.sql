-- 创建数据库
CREATE DATABASE IF NOT EXISTS chaos_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE chaos_website;

-- 创建联系人表
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company VARCHAR(255) NOT NULL COMMENT '公司名称',
  name VARCHAR(255) NOT NULL COMMENT '联系人姓名',
  phone VARCHAR(255) NOT NULL COMMENT '联系电话',
  wish TEXT COMMENT '合作意向/留言',
  createdAt DATETIME NOT NULL COMMENT '创建时间',
  updatedAt DATETIME NOT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='联系人信息表';

-- 创建数据库用户并授权（可选，如果需要特定用户访问）
-- CREATE USER 'chaos_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON chaos_website.* TO 'chaos_user'@'localhost';
-- FLUSH PRIVILEGES;
