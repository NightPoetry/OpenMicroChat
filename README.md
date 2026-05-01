# OpenMicroChat

一个完整、成熟的实时聊天应用，支持一对一聊天、群组聊天、多媒体消息等功能。

## 功能特性

### 核心功能
- 🔐 **用户认证系统**：注册、登录、密码重置
- 📱 **实时消息**：文本、图片、语音、文件消息
- 👥 **联系人管理**：好友请求、联系人列表、备注标签
- 🎯 **群组聊天**：创建群组、邀请成员、群管理
- 🔄 **实时同步**：基于Socket.io的实时消息传递
- 💾 **数据持久化**：本地存储和MongoDB数据库
- 🎨 **现代UI**：响应式设计、深色模式、流畅动画
- 🌙 **主题切换**：支持浅色/深色主题
- 📱 **移动适配**：支持手机、平板、桌面设备
- ♿ **无障碍设计**：符合WCAG AA级标准

### 技术栈

**前端**：
- HTML5 + CSS3 + JavaScript (ES6+)
- 原生模块化开发
- 响应式设计
- 本地存储
- Socket.io Client

**后端**：
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT认证
- RESTful API

## 快速开始

### 环境要求
- Node.js 14+
- MongoDB 4+

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd OpenMicroChat
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   复制 `.env` 文件并根据需要修改：
   ```bash
   cp .env.example .env
   ```

4. **启动MongoDB**
   确保MongoDB服务正在运行：
   ```bash
   # 启动MongoDB服务
   sudo service mongodb start
   # 或使用Docker
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

5. **启动应用**
   ```bash
   # 开发模式
   npm run dev
   # 生产模式
   npm start
   ```

6. **访问应用**
   打开浏览器访问：
   ```
   http://localhost:3000
   ```

## 项目结构

```
OpenMicroChat/
├── src/
│   ├── data/          # 模拟数据
│   ├── modules/       # 前端模块
│   │   ├── auth/      # 认证模块
│   │   ├── chat/      # 聊天模块
│   │   ├── contacts/  # 联系人模块
│   │   ├── settings/  # 设置模块
│   │   ├── storage/   # 存储模块
│   │   ├── store/     # 状态管理
│   │   ├── utils/     # 工具函数
│   ├── main.js        # 应用入口
├── models/            # 后端模型
├── routes/            # 后端路由
├── index.html         # 主页面
├── styles.css         # 样式文件
├── server.js          # 服务器入口
├── package.json       # 依赖配置
├── .env               # 环境变量
├── README.md          # 项目文档
```

## API文档

### 认证API
- `POST /api/auth/register` - 注册新用户
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/update` - 更新用户信息
- `PUT /api/auth/update-password` - 更新密码
- `POST /api/auth/logout` - 用户登出

### 消息API
- `GET /api/messages/:contactId` - 获取与联系人的消息
- `GET /api/messages/group/:groupId` - 获取群聊消息
- `POST /api/messages` - 发送消息
- `POST /api/messages/group` - 发送群消息
- `PUT /api/messages/:messageId/status` - 更新消息状态
- `DELETE /api/messages/:messageId` - 删除消息
- `GET /api/messages/unread/count` - 获取未读消息计数

### 联系人API
- `GET /api/contacts` - 获取联系人列表
- `GET /api/contacts/requests` - 获取好友请求
- `POST /api/contacts/request` - 发送好友请求
- `PUT /api/contacts/request/:requestId/accept` - 接受好友请求
- `PUT /api/contacts/request/:requestId/reject` - 拒绝好友请求
- `DELETE /api/contacts/:contactId` - 删除联系人
- `GET /api/contacts/search/:query` - 搜索用户
- `PUT /api/contacts/:contactId/nickname` - 更新联系人备注
- `PUT /api/contacts/:contactId/tags` - 添加联系人标签

### 群组API
- `POST /api/groups` - 创建群组
- `GET /api/groups` - 获取用户的群组列表
- `GET /api/groups/:groupId` - 获取群组详情
- `POST /api/groups/:groupId/members` - 添加群成员
- `DELETE /api/groups/:groupId/members/:memberId` - 移除群成员
- `PUT /api/groups/:groupId` - 更新群组信息
- `PUT /api/groups/:groupId/members/:memberId/role` - 更新群成员角色
- `POST /api/groups/join` - 通过邀请码加入群组
- `POST /api/groups/:groupId/leave` - 退出群组

## 部署指南

### 本地部署
1. 按照「快速开始」步骤启动应用
2. 访问 http://localhost:3000

### 生产部署

1. **配置环境变量**
   修改 `.env` 文件：
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb://your-mongodb-uri
   JWT_SECRET=your-secure-jwt-secret
   PORT=80
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

3. **启动服务**
   使用PM2管理进程：
   ```bash
   npm install -g pm2
   pm2 start server.js --name openmicrochat
   pm2 save
   ```

4. **配置反向代理**
   使用Nginx配置HTTPS：
   ```nginx
   server {
     listen 443 ssl;
     server_name your-domain.com;
     
     ssl_certificate /path/to/ssl/cert.pem;
     ssl_certificate_key /path/to/ssl/key.pem;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循JavaScript Standard Style
- 模块化开发，避免全局变量

### 调试模式
```bash
npm run dev
```

### 测试
```bash
npm run test
```

### 代码检查
```bash
npm run lint
```

## 安全注意事项

1. **JWT密钥**：生产环境中使用强密钥
2. **MongoDB安全**：启用身份验证，限制IP访问
3. **HTTPS**：生产环境必须使用HTTPS
4. **文件上传**：限制文件大小和类型
5. **输入验证**：所有用户输入必须验证
6. **密码存储**：使用bcrypt加密存储密码

## 常见问题

### Q: 无法连接到MongoDB
A: 确保MongoDB服务正在运行，检查连接字符串是否正确。

### Q: 实时消息不工作
A: 检查Socket.io连接是否正常，确保服务器和客户端都正确配置。

### Q: 图片/文件上传失败
A: 检查文件大小限制，确保服务器有足够的存储空间。

### Q: 部署后无法访问
A: 检查防火墙设置，确保端口已开放。

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

- 项目地址：<repository-url>
- 作者：OpenMicroChat Team

---

**OpenMicroChat** - 为现代通信而生 🚀