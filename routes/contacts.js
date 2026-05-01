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

// 生成联系人ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 联系人路由
module.exports = (db) => {
  const router = express.Router();
  
  // 获取联系人列表
  router.get('/', authMiddleware(db), async (req, res) => {
    try {
      // 获取已接受的联系人
      const contacts = db.data.contacts.filter(
        contact => contact.userId === req.user.id && contact.status === 'accepted'
      ).map(contact => {
        const contactUser = db.data.users.find(u => u.id === contact.contactId);
        return {
          ...contact,
          contactId: contactUser
        };
      });
      
      res.json({ success: true, contacts });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 获取好友请求
  router.get('/requests', authMiddleware(db), async (req, res) => {
    try {
      // 获取待处理的好友请求
      const requests = db.data.contacts.filter(
        contact => contact.contactId === req.user.id && contact.status === 'pending'
      ).map(request => {
        const requestUser = db.data.users.find(u => u.id === request.userId);
        return {
          ...request,
          userId: requestUser
        };
      });
      
      res.json({ success: true, requests });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 发送好友请求
  router.post('/request', authMiddleware(db), async (req, res) => {
    try {
      const { contactId } = req.body;
      
      // 检查是否是自己
      if (contactId === req.user.id) {
        return res.status(400).json({ error: 'Cannot send request to yourself' });
      }
      
      // 检查联系人是否存在
      const contactUser = db.data.users.find(u => u.id === contactId);
      if (!contactUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // 检查是否已经存在联系关系
      const existingContact = db.data.contacts.find(
        contact => (contact.userId === req.user.id && contact.contactId === contactId) || 
                   (contact.userId === contactId && contact.contactId === req.user.id)
      );
      
      if (existingContact) {
        return res.status(400).json({ error: 'Contact relationship already exists' });
      }
      
      // 创建好友请求
      const contact = {
        id: generateId(),
        userId: req.user.id,
        contactId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 添加到数据库
      db.data.contacts.push(contact);
      await db.write();
      
      res.status(201).json({ success: true, message: 'Friend request sent' });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 接受好友请求
  router.put('/request/:requestId/accept', authMiddleware(db), async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // 找到请求
      const requestIndex = db.data.contacts.findIndex(c => c.id === requestId);
      if (requestIndex === -1) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      const request = db.data.contacts[requestIndex];
      
      // 检查是否是请求接收者
      if (request.contactId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to accept this request' });
      }
      
      // 更新请求状态
      db.data.contacts[requestIndex] = {
        ...request,
        status: 'accepted',
        updatedAt: new Date().toISOString()
      };
      
      // 创建反向联系
      const reverseContact = {
        id: generateId(),
        userId: req.user.id,
        contactId: request.userId,
        status: 'accepted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.data.contacts.push(reverseContact);
      await db.write();
      
      res.json({ success: true, message: 'Friend request accepted' });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 拒绝好友请求
  router.put('/request/:requestId/reject', authMiddleware(db), async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // 找到请求
      const requestIndex = db.data.contacts.findIndex(c => c.id === requestId);
      if (requestIndex === -1) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      const request = db.data.contacts[requestIndex];
      
      // 检查是否是请求接收者
      if (request.contactId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to reject this request' });
      }
      
      // 删除请求
      db.data.contacts.splice(requestIndex, 1);
      await db.write();
      
      res.json({ success: true, message: 'Friend request rejected' });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 删除联系人
  router.delete('/:contactId', authMiddleware(db), async (req, res) => {
    try {
      const { contactId } = req.params;
      
      // 删除双向联系
      db.data.contacts = db.data.contacts.filter(
        contact => !(contact.userId === req.user.id && contact.contactId === contactId) && 
                   !(contact.userId === contactId && contact.contactId === req.user.id)
      );
      
      await db.write();
      
      res.json({ success: true, message: 'Contact deleted successfully' });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 搜索用户
  router.get('/search/:query', authMiddleware(db), async (req, res) => {
    try {
      const { query } = req.params;
      
      // 搜索用户
      const users = db.data.users.filter(
        user => user.username.toLowerCase().includes(query.toLowerCase()) && user.id !== req.user.id
      ).map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: user.status
      }));
      
      res.json({ success: true, users });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 更新联系人备注
  router.put('/:contactId/nickname', authMiddleware(db), async (req, res) => {
    try {
      const { contactId } = req.params;
      const { nickname } = req.body;
      
      // 更新备注
      const contactIndex = db.data.contacts.findIndex(
        contact => contact.userId === req.user.id && contact.contactId === contactId
      );
      
      if (contactIndex === -1) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      db.data.contacts[contactIndex] = {
        ...db.data.contacts[contactIndex],
        nickname,
        updatedAt: new Date().toISOString()
      };
      
      await db.write();
      
      res.json({ success: true, contact: db.data.contacts[contactIndex] });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 添加联系人标签
  router.put('/:contactId/tags', authMiddleware(db), async (req, res) => {
    try {
      const { contactId } = req.params;
      const { tags } = req.body;
      
      // 更新标签
      const contactIndex = db.data.contacts.findIndex(
        contact => contact.userId === req.user.id && contact.contactId === contactId
      );
      
      if (contactIndex === -1) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      db.data.contacts[contactIndex] = {
        ...db.data.contacts[contactIndex],
        tags,
        updatedAt: new Date().toISOString()
      };
      
      await db.write();
      
      res.json({ success: true, contact: db.data.contacts[contactIndex] });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  return router;
};