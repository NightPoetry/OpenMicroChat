const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 认证中间件
const authMiddleware = (db) => async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = db.data.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// 生成用户ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 生成头像
const generateAvatar = (username) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
  const colorIndex = username.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  const color = colors[colorIndex];
  
  const svg = `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="50" fill="${color}" rx="25"/><text x="25" y="32" font-size="20" text-anchor="middle" fill="white" font-weight="bold">${username.charAt(0).toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// 认证路由
module.exports = (db) => {
  const router = express.Router();
  
  // 注册
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // 检查用户名是否已存在
      const existingUser = db.data.users.find(u => u.username === username || u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      
      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 创建新用户
      const user = {
        id: generateId(),
        username,
        email,
        password: hashedPassword,
        avatar: generateAvatar(username),
        status: 'offline',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: {
          theme: 'light',
          notifications: true,
          language: 'zh-CN'
        }
      };
      
      // 添加到数据库
      db.data.users.push(user);
      await db.write();
      
      // 生成token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
      });
      
      // 返回用户信息和token
      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          settings: user.settings
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 登录
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // 查找用户
      const user = db.data.users.find(u => u.username === username);
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      // 验证密码
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      // 更新登录时间和状态
      user.lastLogin = new Date().toISOString();
      user.status = 'online';
      await db.write();
      
      // 生成token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
      });
      
      // 返回用户信息和token
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          settings: user.settings
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 获取当前用户信息
  router.get('/me', authMiddleware(db), async (req, res) => {
    try {
      res.json({
        success: true,
        user: req.user
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 更新用户信息
  router.put('/update', authMiddleware(db), async (req, res) => {
    try {
      const updates = req.body;
      
      // 更新用户信息
      const userIndex = db.data.users.findIndex(u => u.id === req.user.id);
      if (userIndex !== -1) {
        db.data.users[userIndex] = { ...db.data.users[userIndex], ...updates };
        await db.write();
      }
      
      res.json({
        success: true,
        user: db.data.users[userIndex]
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 更新密码
  router.put('/update-password', authMiddleware(db), async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // 验证当前密码
      const user = req.user;
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // 更新密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      const userIndex = db.data.users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        db.data.users[userIndex].password = hashedPassword;
        await db.write();
      }
      
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 登出
  router.post('/logout', authMiddleware(db), async (req, res) => {
    try {
      // 更新用户状态为离线
      const userIndex = db.data.users.findIndex(u => u.id === req.user.id);
      if (userIndex !== -1) {
        db.data.users[userIndex].status = 'offline';
        await db.write();
      }
      
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  return router;
};