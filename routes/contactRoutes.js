const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// @route   GET /contact/test
// @desc    Test contact route
// @access  Public
router.get('/contact/test', (req, res) => {
  res.json({ message: '联系表单API工作正常' });
});

// @route   POST /contact
// @desc    Submit contact form
// @access  Public
router.post('/contact', async (req, res) => {
  try {
    const { company, name, phone } = req.body;

    // Validate input
    if (!company || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: '请填写公司名称、姓名和电话号码'
      });
    }

    // 使用Sequelize创建新联系人
    const contact = await Contact.create({
      company,
      name,
      phone
    });

    res.status(201).json({
      success: true,
      message: '提交成功，后续我们将会与您联系',
      data: contact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
