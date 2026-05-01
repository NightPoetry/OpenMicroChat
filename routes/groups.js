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

// 生成ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 群组路由
module.exports = (db) => {
  const router = express.Router();
  
  // 创建群组
  router.post('/', authMiddleware(db), async (req, res) => {
    try {
      const { name, description, memberIds } = req.body;
      
      // 创建群组
      const group = {
        id: generateId(),
        name,
        description,
        creator: req.user.id,
        joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        memberCount: 1 + (memberIds ? memberIds.length : 0),
        maxMembers: 500,
        isPublic: false,
        settings: {
          messageHistory: true,
          allowMembersToInvite: true,
          allowMembersToSendMedia: true
        }
      };
      
      // 添加到数据库
      db.data.groups.push(group);
      
      // 添加创建者为管理员
      const creatorMember = {
        id: generateId(),
        groupId: group.id,
        userId: req.user.id,
        role: 'admin',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        status: 'active'
      };
      
      db.data.groupMembers.push(creatorMember);
      
      // 添加其他成员
      if (memberIds && memberIds.length > 0) {
        for (const memberId of memberIds) {
          if (memberId !== req.user.id) {
            const member = {
              id: generateId(),
              groupId: group.id,
              userId: memberId,
              role: 'member',
              joinDate: new Date().toISOString(),
              lastActive: new Date().toISOString(),
              status: 'active'
            };
            db.data.groupMembers.push(member);
          }
        }
      }
      
      await db.write();
      
      res.status(201).json({ success: true, group });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 获取用户的群组列表
  router.get('/', authMiddleware(db), async (req, res) => {
    try {
      // 获取用户加入的群组
      const groupMembers = db.data.groupMembers.filter(
        member => member.userId === req.user.id
      );
      
      const groups = groupMembers.map(member => {
        const group = db.data.groups.find(g => g.id === member.groupId);
        return {
          ...group,
          role: member.role
        };
      });
      
      res.json({ success: true, groups });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 获取群组详情
  router.get('/:groupId', authMiddleware(db), async (req, res) => {
    try {
      const { groupId } = req.params;
      
      // 检查用户是否是群成员
      const member = db.data.groupMembers.find(
        m => m.groupId === groupId && m.userId === req.user.id
      );
      
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }
      
      // 获取群组详情
      const group = db.data.groups.find(g => g.id === groupId);
      
      // 获取群成员
      const members = db.data.groupMembers.filter(
        m => m.groupId === groupId
      ).map(member => {
        const memberUser = db.data.users.find(u => u.id === member.userId);
        return {
          ...member,
          userId: memberUser
        };
      });
      
      res.json({ success: true, group, members, role: member.role });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 添加群成员
  router.post('/:groupId/members', authMiddleware(db), async (req, res) => {
    try {
      const { groupId } = req.params;
      const { memberIds } = req.body;
      
      // 检查用户是否是群管理员
      const member = db.data.groupMembers.find(
        m => m.groupId === groupId && m.userId === req.user.id && m.role === 'admin'
      );
      
      if (!member) {
        return res.status(403).json({ error: 'Only admins can add members' });
      }
      
      // 添加成员
      for (const memberId of memberIds) {
        // 检查是否已经是成员
        const existingMember = db.data.groupMembers.find(
          m => m.groupId === groupId && m.userId === memberId
        );
        
        if (!existingMember) {
          const newMember = {
            id: generateId(),
            groupId,
            userId: memberId,
            role: 'member',
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            status: 'active'
          };
          db.data.groupMembers.push(newMember);
        }
      }
      
      // 更新成员计数
      const group = db.data.groups.find(g => g.id === groupId);
      if (group) {
        group.memberCount = db.data.groupMembers.filter(m => m.groupId === groupId).length;
        group.updatedAt = new Date().toISOString();
      }
      
      await db.write();
      
      res.json({ success: true, message: 'Members added successfully' });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 移除群成员
  router.delete('/:groupId/members/:memberId', authMiddleware(db), async (req, res) => {
    try {
      const { groupId, memberId } = req.params;
      
      // 检查用户是否是群管理员或要移除自己
      const currentMember = db.data.groupMembers.find(
        m => m.groupId === groupId && m.userId === req.user.id
      );
      
      if (!currentMember) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }
      
      // 只有管理员可以移除其他成员
      if (memberId !== req.user.id && currentMember.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can remove other members' });
      }
      
      // 移除成员
      db.data.groupMembers = db.data.groupMembers.filter(
        m => !(m.groupId === groupId && m.userId === memberId)
      );
      
      // 更新成员计数
      const group = db.data.groups.find(g => g.id === groupId);
      if (group) {
        group.memberCount = db.data.groupMembers.filter(m => m.groupId === groupId).length;
        group.updatedAt = new Date().toISOString();
      }
      
      await db.write();
      
      res.json({ success: true, message: 'Member removed successfully' });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 更新群组信息
  router.put('/:groupId', authMiddleware(db), async (req, res) => {
    try {
      const { groupId } = req.params;
      const updates = req.body;
      
      // 检查用户是否是群管理员
      const member = db.data.groupMembers.find(
        m => m.groupId === groupId && m.userId === req.user.id && m.role === 'admin'
      );
      
      if (!member) {
        return res.status(403).json({ error: 'Only admins can update group info' });
      }
      
      // 更新群组信息
      const groupIndex = db.data.groups.findIndex(g => g.id === groupId);
      if (groupIndex !== -1) {
        db.data.groups[groupIndex] = {
          ...db.data.groups[groupIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        await db.write();
      }
      
      res.json({ success: true, group: db.data.groups[groupIndex] });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 更新群成员角色
  router.put('/:groupId/members/:memberId/role', authMiddleware(db), async (req, res) => {
    try {
      const { groupId, memberId } = req.params;
      const { role } = req.body;
      
      // 检查用户是否是群管理员
      const currentMember = db.data.groupMembers.find(
        m => m.groupId === groupId && m.userId === req.user.id && m.role === 'admin'
      );
      
      if (!currentMember) {
        return res.status(403).json({ error: 'Only admins can update roles' });
      }
      
      // 更新角色
      const memberIndex = db.data.groupMembers.findIndex(
        m => m.groupId === groupId && m.userId === memberId
      );
      
      if (memberIndex !== -1) {
        db.data.groupMembers[memberIndex] = {
          ...db.data.groupMembers[memberIndex],
          role,
          lastActive: new Date().toISOString()
        };
        await db.write();
      }
      
      res.json({ success: true, member: db.data.groupMembers[memberIndex] });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 通过邀请码加入群组
  router.post('/join', authMiddleware(db), async (req, res) => {
    try {
      const { joinCode } = req.body;
      
      // 查找群组
      const group = db.data.groups.find(g => g.joinCode === joinCode);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // 检查是否已经是成员
      const existingMember = db.data.groupMembers.find(
        m => m.groupId === group.id && m.userId === req.user.id
      );
      
      if (existingMember) {
        return res.status(400).json({ error: 'Already a member of this group' });
      }
      
      // 添加为成员
      const member = {
        id: generateId(),
        groupId: group.id,
        userId: req.user.id,
        role: 'member',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        status: 'active'
      };
      
      db.data.groupMembers.push(member);
      
      // 更新成员计数
      group.memberCount = db.data.groupMembers.filter(m => m.groupId === group.id).length;
      group.updatedAt = new Date().toISOString();
      
      await db.write();
      
      res.json({ success: true, group });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // 退出群组
  router.post('/:groupId/leave', authMiddleware(db), async (req, res) => {
    try {
      const { groupId } = req.params;
      
      // 移除成员
      db.data.groupMembers = db.data.groupMembers.filter(
        m => !(m.groupId === groupId && m.userId === req.user.id)
      );
      
      // 更新成员计数
      const group = db.data.groups.find(g => g.id === groupId);
      if (group) {
        group.memberCount = db.data.groupMembers.filter(m => m.groupId === groupId).length;
        group.updatedAt = new Date().toISOString();
      }
      
      await db.write();
      
      res.json({ success: true, message: 'Left group successfully' });
      
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  return router;
};