# 技术架构

## 分层结构

```
┌─────────────────────────────┐
│    界面层 (HTML + CSS)       │  语义化结构 + CSS 自定义属性
├─────────────────────────────┤
│    模块层 (ES Modules)       │  Auth / Chat / Contacts / Tags / Settings
├─────────────────────────────┤
│    状态层 (Store + Events)   │  发布-订阅状态管理 + 事件总线
├─────────────────────────────┤
│    持久化层 (Storage)        │  localStorage 封装
├─────────────────────────────┤
│    服务层 (Express + lowdb)  │  REST API + Socket.io + JWT
└─────────────────────────────┘
```

## 前端模块

### 入口 (`src/main.js`)

App 类负责：
- 初始化所有模块并注入依赖（Store、Events、Storage）
- 管理应用生命周期（登录/登出/体验模式切换）
- 协调模块间不直接处理的全局行为（主题切换、移动端导航）

### 模块列表

| 模块 | 文件 | 职责 |
|------|------|------|
| AuthModule | `auth/auth.js` | 认证界面渲染、登录/注册/登出、Token 管理、用户菜单 |
| ContactsModule | `contacts/contacts.js` | 联系人列表渲染、搜索过滤、标签过滤、长按打标签、添加好友 |
| ChatModule | `chat/chat.js` | 聊天窗口渲染、消息发送/接收、多媒体（图片/语音/文件）、聊天头部 |
| SettingsModule | `settings/settings.js` | 上下文感知的设置页面（用户/好友/群聊三种模式共用一个容器） |
| TagsModule | `tags/tags.js` | 标签胶囊栏渲染、标签选择/创建、协调韦恩图展示 |
| VennDiagram | `tags/venn.js` | SVG 韦恩图渲染、弹性动画序列、区域点击交互 |

### 通信机制

模块之间**不互相引用**，通过事件总线通信：

```
用户点击标签胶囊
  → TagsModule 更新 store.selectedTags
  → TagsModule emit('tags:change')
  → ContactsModule 监听 tags:change → 重新渲染（应用标签过滤）
  → TagsModule 自身监听 tags:change → 显示/更新韦恩图
```

主要事件：

| 事件 | 发布者 | 监听者 | 说明 |
|------|--------|--------|------|
| `auth:login` | AuthModule | App, ContactsModule | 用户登录成功 |
| `auth:demo` | AuthModule | App, ContactsModule | 进入体验模式 |
| `auth:logout` | AuthModule | App | 用户登出 |
| `contact:select` | ContactsModule | App, ChatModule, AnimationsModule | 选择联系人 |
| `contacts:update` | 多处 | ContactsModule | 联系人数据变化需要重新渲染 |
| `tags:change` | TagsModule | ContactsModule, TagsModule | 标签选择变化 |
| `tags:render` | ContactsModule | TagsModule | 联系人标签被修改后通知标签栏刷新 |
| `settings:show` | ChatModule, AuthModule | SettingsModule | 打开设置页面 |
| `settings:close` | SettingsModule | ChatModule | 关闭设置页面 |
| `theme:change` | AuthModule | App | 主题切换 |

### 状态管理 (`store/store.js`)

单例 Store，发布-订阅模式：

```js
state = {
  contacts: [],          // 联系人列表
  currentContact: null,  // 当前选中的联系人
  messages: {},          // 消息 (按联系人 ID 分组)
  tags: [],              // 标签定义 [{id, name, color}]
  selectedTags: [],      // 当前选中的标签 ID
  tagSubFilter: null,    // 韦恩图区域子过滤
  settings: {},          // 用户设置
  user: null,            // 当前用户
  isDemo: false          // 是否体验模式
}
```

## 后端架构

### API 路由

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/auth/register` | POST | 注册 | 否 |
| `/api/auth/login` | POST | 登录 | 否 |
| `/api/auth/me` | GET | 获取当前用户 | 是 |
| `/api/auth/update` | PUT | 更新用户信息 | 是 |
| `/api/auth/update-password` | PUT | 修改密码 | 是 |
| `/api/auth/logout` | POST | 登出 | 是 |
| `/api/messages/:contactId` | GET | 获取消息历史 | 是 |
| `/api/messages` | POST | 发送消息 | 是 |
| `/api/messages/:id/status` | PUT | 更新消息状态 | 是 |
| `/api/contacts` | GET/POST | 联系人管理 | 是 |
| `/api/groups` | GET/POST | 群组管理 | 是 |

### 数据存储

使用 lowdb（JSON 文件数据库），数据文件 `db.json`：

```json
{
  "users": [],
  "messages": [],
  "contacts": [],
  "groups": [],
  "groupMembers": []
}
```

选择 lowdb 而非传统数据库的原因：
- 零配置，无需安装数据库服务
- 单文件，便于备份和迁移
- 适合小型部署场景
- 开发调试时可以直接查看/编辑数据文件

### Socket.io 事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `join` | 客户端 → 服务端 | 用户加入个人房间 |
| `sendMessage` | 客户端 → 服务端 | 发送私聊消息 |
| `newMessage` | 服务端 → 客户端 | 接收新消息 |
| `messageSent` | 服务端 → 客户端 | 消息发送确认 |
| `joinGroup` | 客户端 → 服务端 | 加入群聊房间 |
| `sendGroupMessage` | 客户端 → 服务端 | 发送群消息 |
| `newGroupMessage` | 服务端 → 客户端 | 接收群消息 |

## CSS 架构

### 自定义属性体系

所有颜色、尺寸、动画参数通过 CSS 自定义属性定义，支持主题切换：

```css
:root {
  --color-bg, --color-surface, --color-text, ...
  --radius-sm, --radius-md, --radius-lg
  --sidebar-width, --header-height
  --transition
}
```

暗色模式通过两种方式触发：
1. `[data-theme="dark"]` — 用户手动切换
2. `@media (prefers-color-scheme: dark)` — 跟随系统（当 `data-theme` 未设置时）

### 防御性布局规则

1. **Flex 子元素必须可压缩**：所有 `flex: 1` 元素加 `min-height: 0`（纵向）或 `min-width: 0`（横向）
2. **文本必须有截断**：名称、消息预览等可变长文本加 `overflow: hidden; text-overflow: ellipsis`
3. **固定区域不可压缩**：Header、Input 区域加 `flex-shrink: 0`

## 文件结构

```
OpenMicroChat/
├── server.js              # Express 服务入口
├── index.html             # 前端页面（语义化空壳）
├── styles.css             # 全局样式（CSS 自定义属性）
├── package.json
├── .env.example
├── routes/
│   ├── auth.js            # 认证路由
│   ├── messages.js        # 消息路由
│   ├── contacts.js        # 联系人路由
│   └── groups.js          # 群组路由
├── models/                # Mongoose 模型（备用）
├── src/
│   ├── main.js            # 前端入口
│   ├── data/
│   │   ├── contacts.js    # 体验模式预设联系人
│   │   ├── messages.js    # 体验模式预设消息
│   │   └── tags.js        # 默认标签定义
│   └── modules/
│       ├── auth/          # 认证模块
│       ├── chat/          # 聊天模块
│       ├── contacts/      # 联系人模块
│       ├── settings/      # 设置模块
│       ├── tags/          # 标签 + 韦恩图模块
│       ├── store/         # 状态管理
│       ├── storage/       # 本地持久化
│       └── utils/         # 工具函数
└── docs/                  # 设计文档
```
