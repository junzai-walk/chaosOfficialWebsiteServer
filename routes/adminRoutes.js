const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { Op } = require('sequelize');

// 管理员账号配置
const adminAccounts = {
  'superadmin': {
    password: 'Chaos2025!',
    role: 'super',
    roleName: '超级管理员',
    permissions: ['view', 'export', 'delete', 'manage']
  },
  'admin': {
    password: 'Admin123!',
    role: 'normal',
    roleName: '普通管理员',
    permissions: ['view', 'export']
  },
  'viewer': {
    password: 'View2025!',
    role: 'readonly',
    roleName: '只读管理员',
    permissions: ['view']
  }
};

// 生成简单的token（实际项目中应该使用JWT）
const generateToken = (username, role) => {
  return Buffer.from(`${username}:${role}:${Date.now()}`).toString('base64');
};

// 解析token获取用户信息
const parseToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [username, role, timestamp] = decoded.split(':');

    // 检查token是否过期（24小时）
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return null;
    }

    return { username, role };
  } catch (error) {
    return null;
  }
};

// 管理员认证中间件
const adminAuth = (requiredPermissions = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = parseToken(token);

    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }

    const account = adminAccounts[userInfo.username];
    if (!account) {
      return res.status(401).json({
        success: false,
        message: '无效的用户账号'
      });
    }

    // 检查权限
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every(permission =>
        account.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '权限不足，无法执行此操作'
        });
      }
    }

    // 将用户信息添加到请求对象中
    req.user = {
      username: userInfo.username,
      role: userInfo.role,
      roleName: account.roleName,
      permissions: account.permissions
    };

    next();
  };
};

// @route   GET /admin/contacts
// @desc    获取所有联系人信息（分页、搜索、筛选）
// @access  Private (需要查看权限)
router.get('/admin/contacts', adminAuth(['view']), async (req, res) => {
  try {
    const {
      page = 1,           // 页码，默认第1页
      limit = 10,         // 每页数量，默认10条
      search = '',        // 搜索关键词
      type = 'all',       // 表单类型：all(全部)、consult(咨询)、cooperation(合作)
      startDate = '',     // 开始日期
      endDate = '',       // 结束日期
      sortBy = 'createdAt', // 排序字段
      sortOrder = 'DESC'  // 排序方向
    } = req.query;

    // 构建查询条件
    const whereConditions = {};

    // 搜索条件：在企业名称、联系人姓名、电话中搜索
    if (search) {
      whereConditions[Op.or] = [
        { company: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    // 表单类型筛选
    if (type === 'consult') {
      // 咨询表单：wish字段为空或null
      whereConditions[Op.or] = [
        { wish: null },
        { wish: '' }
      ];
    } else if (type === 'cooperation') {
      // 合作意向表单：wish字段不为空
      whereConditions.wish = { [Op.ne]: null };
      whereConditions.wish = { [Op.ne]: '' };
    }

    // 日期范围筛选
    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    } else if (startDate) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(endDate + ' 23:59:59')
      };
    }

    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 查询数据
    const { count, rows } = await Contact.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: ['id', 'company', 'name', 'phone', 'wish', 'createdAt', 'updatedAt']
    });

    // 计算总页数
    const totalPages = Math.ceil(count / parseInt(limit));

    // 为每条记录添加表单类型标识
    const contactsWithType = rows.map(contact => ({
      ...contact.toJSON(),
      formType: (contact.wish && contact.wish.trim() !== '') ? 'cooperation' : 'consult',
      formTypeName: (contact.wish && contact.wish.trim() !== '') ? '合作意向' : '咨询表单'
    }));

    res.json({
      success: true,
      message: '获取联系人信息成功',
      data: {
        contacts: contactsWithType,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalCount: count,
          limit: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('获取联系人信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   GET /admin/contacts/stats
// @desc    获取联系人统计信息
// @access  Private (需要查看权限)
router.get('/admin/contacts/stats', adminAuth(['view']), async (req, res) => {
  try {
    // 总数统计
    const totalCount = await Contact.count();

    // 咨询表单数量（wish为空）
    const consultCount = await Contact.count({
      where: {
        [Op.or]: [
          { wish: null },
          { wish: '' }
        ]
      }
    });

    // 合作意向表单数量（wish不为空）
    const cooperationCount = await Contact.count({
      where: {
        wish: { [Op.ne]: null },
        wish: { [Op.ne]: '' }
      }
    });

    // 今日新增
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Contact.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    // 本周新增
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekCount = await Contact.count({
      where: {
        createdAt: {
          [Op.gte]: weekStart
        }
      }
    });

    // 本月新增
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthCount = await Contact.count({
      where: {
        createdAt: {
          [Op.gte]: monthStart
        }
      }
    });

    res.json({
      success: true,
      message: '获取统计信息成功',
      data: {
        total: totalCount,
        consult: consultCount,
        cooperation: cooperationCount,
        today: todayCount,
        week: weekCount,
        month: monthCount
      }
    });

  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   POST /admin/login
// @desc    管理员登录
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      });
    }

    // 验证账号密码
    const account = adminAccounts[username];
    if (!account || account.password !== password) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成token
    const token = generateToken(username, account.role);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: token,
        username: username,
        role: account.role,
        roleName: account.roleName,
        permissions: account.permissions
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   POST /admin/contacts/export
// @desc    导出联系人数据
// @access  Private (需要导出权限)
router.post('/admin/contacts/export', adminAuth(['export']), async (req, res) => {
  try {
    const {
      search = '',
      type = 'all',
      startDate = '',
      endDate = ''
    } = req.body;

    // 构建查询条件（与获取列表相同的逻辑）
    const whereConditions = {};

    if (search) {
      whereConditions[Op.or] = [
        { company: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    if (type === 'consult') {
      whereConditions[Op.or] = [
        { wish: null },
        { wish: '' }
      ];
    } else if (type === 'cooperation') {
      whereConditions.wish = { [Op.ne]: null };
      whereConditions.wish = { [Op.ne]: '' };
    }

    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    } else if (startDate) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(endDate + ' 23:59:59')
      };
    }

    // 获取所有符合条件的数据
    const contacts = await Contact.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'company', 'name', 'phone', 'wish', 'createdAt']
    });

    // 格式化数据，确保所有字段都有有效值
    const exportData = contacts.map(contact => {
      // 安全地获取字段值，避免undefined
      const safeGet = (value, defaultValue = '-') => {
        if (value === null || value === undefined || value === '') {
          return defaultValue;
        }
        return String(value).trim() || defaultValue;
      };

      return {
        ID: contact.id || 0,
        企业名称: safeGet(contact.company, '未填写'),
        联系人: safeGet(contact.name, '未填写'),
        联系电话: safeGet(contact.phone, '未填写'),
        表单类型: (contact.wish && String(contact.wish).trim() !== '') ? '合作意向' : '咨询表单',
        合作意向: safeGet(contact.wish, '无'),
        提交时间: contact.createdAt ? new Date(contact.createdAt).toLocaleString('zh-CN') : '未知时间'
      };
    });

    res.json({
      success: true,
      message: '数据导出成功',
      data: {
        contacts: exportData,
        total: exportData.length,
        exportTime: new Date().toLocaleString('zh-CN'),
        exportBy: req.user.username
      }
    });

  } catch (error) {
    console.error('导出数据失败:', error);
    res.status(500).json({
      success: false,
      message: '导出失败'
    });
  }
});

// @route   DELETE /admin/contacts/:id
// @desc    删除联系人记录
// @access  Private (需要删除权限)
router.delete('/admin/contacts/:id', adminAuth(['delete']), async (req, res) => {
  try {
    const { id } = req.params;

    // 查找记录
    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    // 删除记录
    await contact.destroy();

    res.json({
      success: true,
      message: '删除成功',
      data: {
        deletedId: id,
        deletedBy: req.user.username,
        deleteTime: new Date().toLocaleString('zh-CN')
      }
    });

  } catch (error) {
    console.error('删除记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

// @route   GET /admin/user/info
// @desc    获取当前登录用户信息
// @access  Private
router.get('/admin/user/info', adminAuth(), async (req, res) => {
  try {
    res.json({
      success: true,
      message: '获取用户信息成功',
      data: {
        username: req.user.username,
        role: req.user.role,
        roleName: req.user.roleName,
        permissions: req.user.permissions
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

module.exports = router;
