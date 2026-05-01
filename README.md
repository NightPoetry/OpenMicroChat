# OpenMicroChat

一个注重交互体验的现代聊天应用。标签系统 + 韦恩图可视化筛选，触控友好，开箱即用。

> **声明**：本项目为学术研究与技术探索项目，仅供学习和研究使用，不适合直接用于生产环境或大规模用户服务。详见 [免责声明](DISCLAIMER.md)。

## 快速开始

```bash
npm install
cp .env.example .env
npm start
# 打开 http://localhost:3000
```

点击「体验模式」可以直接体验，无需注册。

### 桌面应用

项目支持通过 Tauri 打包为桌面应用（macOS / Windows / Linux）和移动应用（Android）：

```bash
cargo tauri build        # 构建桌面应用
cargo tauri android build --apk  # 构建 Android APK（需要 Android SDK）
```

桌面/移动端应用在登录页面可配置服务器地址，连接你自行部署的后端。

## 功能

- **即时通讯**：文本、图片、语音、文件消息
- **标签系统**：长按联系人打标签，标签胶囊栏一键筛选
- **韦恩图筛选**：选两个标签自动展示交集动画，点击不同区域进一步筛选
- **用户系统**：注册/登录（JWT）、用户资料管理
- **群聊**：创建群组、成员管理
- **主题切换**：浅色/深色，跟随系统或手动切换
- **响应式**：桌面/平板/手机自适应，移动端侧边栏滑动切换
- **多端支持**：Web / macOS / Windows / Linux / Android
- **可配置服务器**：桌面端可填入自部署的服务器地址
- **体验模式**：无需注册，预设数据，即开即用

## 技术栈

| 层次 | 选择 |
|------|------|
| 前端 | 原生 JS (ES Modules)，无框架 |
| 样式 | CSS 自定义属性，防御性布局 |
| 后端 | Express + lowdb (JSON 单文件数据库) |
| 认证 | JWT (bcrypt 密码加密) |
| 实时 | Socket.io |
| 桌面/移动 | Tauri 2 |
| CI/CD | GitHub Actions 多平台自动构建 |

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
│       ├── auth/       # 认证（含服务器地址配置）
│       ├── chat/       # 聊天
│       ├── contacts/   # 联系人（含标签过滤、长按打标签）
│       ├── tags/       # 标签胶囊栏 + 韦恩图动画
│       ├── settings/   # 上下文感知的设置页面
│       ├── store/      # 状态管理
│       └── storage/    # localStorage 持久化
├── src-tauri/          # Tauri 桌面/移动端配置
├── .github/workflows/  # CI 自动构建
└── docs/               # 设计文档
```

## 安全与隐私

- 本项目**不主动收集任何用户数据**，所有数据存储在用户自行部署的服务器上
- 通信安全依赖部署者配置 HTTPS，项目本身**未实现端到端加密**
- 建议**私有化部署**，不要在公共服务器上存储敏感聊天内容
- 详见 [安全指南](SECURITY.md)

## 协议与免责

- 开源协议：[MIT](LICENSE)
- 免责声明：[DISCLAIMER.md](DISCLAIMER.md)
- 安全指南：[SECURITY.md](SECURITY.md)

本软件按"原样"提供，不包含任何明示或暗示的担保。开发者不对使用本软件造成的任何损失承担责任。
