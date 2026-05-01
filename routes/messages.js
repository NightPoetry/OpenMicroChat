const express = require('express');
const jwt = require('jsonwebtoken');

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

// 生成消息ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 消息路由
module.exports = (db) => {
  const router = express.Router();
  
  // 获取与特定联系人的消息
  router.get('/:contactId', authMiddleware(db), async (req, res) => {
    try {
      const { contactId } = req.params;
      
      // 获取消息历史
      const messages = db.data.messages.filter(msg => 
        (msg.sender === req.user.id && msg.receiver === contactId) || 
        (msg.sender === contactId && msg.receiver === req.user.id)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // 更新消息状态为已读
      db.data.messages = db.data.messages.map(msg => {
        if (msg.sender === contactId && msg.receiver === req.user.id && msg.status !== 'read') {
          return { ...msg, status: 'read' };
        }
        return msg;
      });
      await db.write();
      
      res.json({ success: true, messages });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 获取群聊消息
  router.get('/group/:groupId', authMiddleware(db), async (req, res) => {
    try {
      const { groupId } = req.params;
      
      // 获取群消息历史
      const messages = db.data.messages.filter(msg => msg.group === groupId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(msg => {
          const sender = db.data.users.find(u => u.id === msg.sender);
          return {
            ...msg,
            sender: sender ? { id: sender.id, username: sender.username, avatar: sender.avatar } : null
          };
        });
      
      res.json({ success: true, messages });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 发送消息
  router.post('/', authMiddleware(db), async (req, res) => {
    try {
      const { receiverId, content, type } = req.body;
      
      // 创建消息
      const message = {
        id: generateId(),
        sender: req.user.id,
        receiver: receiverId,
        content,
        type: type || 'text',
        status: 'sent',
        timestamp: new Date().toISOString()
      };
      
      // 添加到数据库
      db.data.messages.push(message);
      await db.write();
      
      // 填充发送者信息
      const populatedMessage = {
        ...message,
        sender: { id: req.user.id, username: req.user.username, avatar: req.user.avatar }
      };
      
      res.status(201).json({ success: true, message: populatedMessage });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 发送群消息
  router.post('/group', authMiddleware(db), async (req, res) => {
    try {
      const { groupId, content, type } = req.body;
      
      // 创建群消息
      const message = {
        id: generateId(),
        sender: req.user.id,
        group: groupId,
        content,
        type: type || 'text',
        status: 'sent',
        timestamp: new Date().toISOString()
      };
      
      // 添加到数据库
      db.data.messages.push(message);
      await db.write();
      
      // 填充发送者信息
      const populatedMessage = {
        ...message,
        sender: { id: req.user.id, username: req.user.username, avatar: req.user.avatar }
      };
      
      res.status(201).json({ success: true, message: populatedMessage });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 更新消息状态
  router.put('/:messageId/status', authMiddleware(db), async (req, res) => {
    try {
      const { messageId } = req.params;
      const { status } = req.body;
      
      const messageIndex = db.data.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      db.data.messages[messageIndex] = { ...db.data.messages[messageIndex], status };
      await db.write();
      
      res.json({ success: true, message: db.data.messages[messageIndex] });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 删除消息
  router.delete('/:messageId', authMiddleware(db), async (req, res) => {
    try {
      const { messageId } = req.params;
      
      const messageIndex = db.data.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // 检查是否是消息发送者
      if (db.data.messages[messageIndex].sender !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this message' });
      }
      
      db.data.messages.splice(messageIndex, 1);
      await db.write();
      
      res.json({ success: true, message: 'Message deleted successfully' });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 获取未读消息计数
  router.get('/unread/count', authMiddleware(db), async (req, res) => {
    try {
      const count = db.data.messages.filter(msg => 
        msg.receiver === req.user.id && msg.status !== 'read'
      ).length;
      
      res.json({ success: true, count });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  return router;
};