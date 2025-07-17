const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const contactRoutes = require('./routes/contactRoutes');
const cooperationRoutes = require('./routes/cooperationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Use routes
app.use('', contactRoutes);
app.use('', cooperationRoutes);
app.use('', adminRoutes);

// Add API prefix routes for production environment
app.use('/api', contactRoutes);
app.use('/api', cooperationRoutes);

// 连接到MySQL数据库
const { connectDB } = require('./config/db');
connectDB();

// Define port
const PORT = process.env.PORT || 5000;

// Add a test route
app.get('/', (req, res) => {
  res.send('服务器运行正常');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器端口号已经执行 ${PORT}`);
  console.log(`服务器地址: http://localhost:${PORT}`);
});
