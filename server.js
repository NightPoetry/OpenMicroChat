const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { JSONFile } = require('lowdb/node');
const { Low } = require('lowdb');

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// 初始化lowdb单文件数据库
const adapter = new JSONFile('./db.json');
const defaultData = {
  users: [],
  messages: [],
  contacts: [],
  groups: [],
  groupMembers: []
};
const db = new Low(adapter, defaultData);

// 初始化数据库
const initDB = async () => {
  await db.read();
  await db.write();
  console.log('LowDB initialized successfully');
};

// 初始化数据库
initDB();

// 导入路由
const authRoutes = require('./routes/auth')(db);
const messageRoutes = require('./routes/messages')(db);
const contactRoutes = require('./routes/contacts')(db);
const groupRoutes = require('./routes/groups')(db);

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/groups', groupRoutes);

// 根路径
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io 事件处理
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // 加入房间
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // 发送消息
  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, content, type } = data;

      // 创建消息
      const message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        sender: senderId,
        receiver: receiverId,
        content,
        type,
        status: 'sent',
        createdAt: new Date().toISOString()
      };

      // 保存到LowDB
      db.data.messages.push(message);
      await db.write();

      // 发送给接收者
      io.to(receiverId).emit('newMessage', message);
      // 确认发送成功
      io.to(senderId).emit('messageSent', message);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // 加入群聊
  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`User joined group ${groupId}`);
  });

  // 发送群消息
  socket.on('sendGroupMessage', async (data) => {
    try {
      const { senderId, groupId, content, type } = data;

      // 创建群消息
      const message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        sender: senderId,
        group: groupId,
        content,
        type,
        status: 'sent',
        createdAt: new Date().toISOString()
      };

      // 保存到LowDB
      db.data.messages.push(message);
      await db.write();

      // 发送给群里所有成员
      io.to(groupId).emit('newGroupMessage', message);
      // 确认发送成功
      io.to(senderId).emit('messageSent', message);

    } catch (error) {
      console.error('Error sending group message:', error);
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

module.exports = { app, server, io };