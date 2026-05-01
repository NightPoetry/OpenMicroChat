# OpenMicroChat

一个注重交互体验的现代聊天应用。标签系统 + 韦恩图可视化筛选，触控友好，开箱即用。

## 快速开始

```bash
npm install
cp .env.example .env
npm start
# 打开 http://localhost:3000
```

点击「体验模式」可以直接体验，无需注册。

## 功能

- **即时通讯**：文本、图片、语音、文件消息
- **标签系统**：长按联系人打标签，标签胶囊栏一键筛选
- **韦恩图筛选**：选两个标签自动展示交集动画，点击不同区域进一步筛选
- **用户系统**：注册/登录（JWT）、用户资料管理
- **群聊**：创建群组、成员管理
- **主题切换**：浅色/深色，跟随系统或手动切换
- **响应式**：桌面/平板/手机自适应，移动端侧边栏滑动切换
- **体验模式**：无需注册，预设数据，即开即用

## 技术栈

| 层次 | 选择 |
|------|------|
| 前端 | 原生 JS (ES Modules)，无框架 |
| 样式 | CSS 自定义属性，防御性布局 |
| 后端 | Express + lowdb (JSON 单文件数据库) |
| 认证 | JWT (bcrypt 密码加密) |
| 实时 | Socket.io |

## 设计文档

- [设计哲学](docs/design-philosophy.md) — 触控优先、标签即视图、操作语义统一等核心原则
- [设计演进](docs/design-evolution.md) — 从原型到当前形态的决策记录
- [技术架构](docs/architecture.md) — 分层结构、模块通信、API 列表、CSS 体系

## 项目结构

```
├── server.js           # 服务端入口
├── index.html          # 前端页面（空壳，内容由 JS 渲染）
├── styles.css          # 全局样式
├── routes/             # API 路由
├── src/
│   ├── main.js         # 前端入口
│   ├── data/           # 体验模式预设数据
│   └── modules/
│       ├── auth/       # 认证
│       ├── chat/       # 聊天
│       ├── contacts/   # 联系人（含标签过滤、长按打标签）
│       ├── tags/       # 标签胶囊栏 + 韦恩图动画
│       ├── settings/   # 上下文感知的设置页面
│       ├── store/      # 状态管理
│       └── storage/    # localStorage 持久化
└── docs/               # 设计文档
```

## 协议

[MIT](LICENSE)
