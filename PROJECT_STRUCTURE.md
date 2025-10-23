# 项目结构说明

## 完整目录树

```
aiworkhelper-web/
├── public/                          # 静态资源目录
│   └── vite.svg                     # 应用图标
│
├── src/                             # 源代码目录
│   ├── api/                         # API 接口层
│   │   ├── approval.ts              # 审批相关接口
│   │   ├── chat.ts                  # AI 聊天接口
│   │   ├── department.ts            # 部门管理接口
│   │   ├── todo.ts                  # 待办事项接口
│   │   ├── upload.ts                # 文件上传接口
│   │   └── user.ts                  # 用户管理接口
│   │
│   ├── layout/                      # 布局组件
│   │   └── Index.vue                # 主布局（侧边栏+头部+内容区）
│   │
│   ├── router/                      # 路由配置
│   │   └── index.ts                 # 路由定义、守卫、权限控制
│   │
│   ├── stores/                      # Pinia 状态管理
│   │   └── user.ts                  # 用户状态（登录、用户信息）
│   │
│   ├── styles/                      # 全局样式
│   │   └── index.css                # 全局 CSS 样式
│   │
│   ├── types/                       # TypeScript 类型定义
│   │   └── index.ts                 # 所有接口类型、数据模型
│   │
│   ├── utils/                       # 工具函数
│   │   ├── request.ts               # Axios 封装（拦截器、错误处理）
│   │   └── websocket.ts             # WebSocket 封装（重连、心跳）
│   │
│   ├── views/                       # 页面组件
│   │   ├── approval/                # 审批管理模块
│   │   │   ├── Create.vue           # 发起审批页面
│   │   │   └── Index.vue            # 审批列表页面
│   │   │
│   │   ├── chat/                    # AI 聊天模块
│   │   │   └── Index.vue            # 聊天主界面
│   │   │
│   │   ├── department/              # 部门管理模块
│   │   │   └── Index.vue            # 部门树形管理
│   │   │
│   │   ├── todo/                    # 待办事项模块
│   │   │   └── Index.vue            # 待办列表和管理
│   │   │
│   │   ├── user/                    # 用户管理模块
│   │   │   └── Index.vue            # 用户列表和管理
│   │   │
│   │   ├── Dashboard.vue            # 工作台首页
│   │   └── Login.vue                # 登录页面
│   │
│   ├── App.vue                      # 根组件
│   └── main.ts                      # 应用入口
│
├── .vscode/                         # VSCode 配置
│   ├── extensions.json              # 推荐扩展
│   └── settings.json                # 编辑器设置
│
├── .env.development                 # 开发环境变量
├── .env.production                  # 生产环境变量
├── .gitignore                       # Git 忽略文件
├── .npmrc                           # NPM 配置
├── CHANGELOG.md                     # 更新日志
├── DEPLOYMENT.md                    # 部署指南
├── index.html                       # HTML 入口文件
├── package.json                     # 项目依赖和脚本
├── PROJECT_STRUCTURE.md             # 本文件
├── QUICKSTART.md                    # 快速启动指南
├── README.md                        # 项目说明文档
├── tsconfig.json                    # TypeScript 配置
├── tsconfig.node.json               # Node TypeScript 配置
└── vite.config.ts                   # Vite 构建配置
```

## 核心文件说明

### 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目依赖、脚本、元信息 |
| `vite.config.ts` | Vite 构建配置、插件、代理设置 |
| `tsconfig.json` | TypeScript 编译配置 |
| `.env.development` | 开发环境变量（API 地址等） |
| `.env.production` | 生产环境变量 |

### 源代码

#### API 层 (`src/api/`)
所有 API 接口的封装，每个文件对应一个业务模块：
- 返回 Promise 类型
- 使用 TypeScript 类型约束
- 统一错误处理

#### 类型定义 (`src/types/`)
完整的 TypeScript 类型定义：
- API 请求/响应类型
- 数据模型类型
- 业务实体类型
- 确保类型安全

#### 工具函数 (`src/utils/`)
- `request.ts`: Axios 实例配置、请求/响应拦截器
- `websocket.ts`: WebSocket 连接管理、重连机制

#### 状态管理 (`src/stores/`)
使用 Pinia 管理全局状态：
- `user.ts`: 用户信息、登录状态、Token 管理

#### 路由 (`src/router/`)
- 路由定义
- 路由守卫（认证、权限）
- 路由懒加载

#### 布局 (`src/layout/`)
- 主布局组件
- 侧边栏导航
- 顶部栏
- 内容区域

#### 页面组件 (`src/views/`)
所有业务页面，按功能模块划分：
- `Login.vue`: 登录页
- `Dashboard.vue`: 工作台
- `todo/`: 待办事项模块
- `approval/`: 审批管理模块
- `department/`: 部门管理模块
- `user/`: 用户管理模块
- `chat/`: AI 聊天模块

## 技术架构图

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                 Vue 3 App                       │
│  ┌──────────────────────────────────────────┐  │
│  │         Router (路由层)                   │  │
│  │  - 路由守卫                               │  │
│  │  - 权限控制                               │  │
│  └──────────────────────────────────────────┘  │
│                      │                          │
│                      ▼                          │
│  ┌──────────────────────────────────────────┐  │
│  │         Views (视图层)                    │  │
│  │  - Login                                  │  │
│  │  - Dashboard                              │  │
│  │  - Todo / Approval / Chat ...             │  │
│  └──────────────────────────────────────────┘  │
│            │                 │                  │
│            ▼                 ▼                  │
│  ┌──────────────┐  ┌─────────────────┐         │
│  │ Pinia Store  │  │  Components     │         │
│  │ - User       │  │  - Layout       │         │
│  │ - ...        │  │  - Common       │         │
│  └──────────────┘  └─────────────────┘         │
│            │                                    │
│            ▼                                    │
│  ┌──────────────────────────────────────────┐  │
│  │         API Layer (接口层)                │  │
│  │  - User API                               │  │
│  │  - Todo API                               │  │
│  │  - Approval API                           │  │
│  │  - Chat API                               │  │
│  └──────────────────────────────────────────┘  │
│            │                 │                  │
│            ▼                 ▼                  │
│  ┌──────────────┐  ┌─────────────────┐         │
│  │ HTTP (Axios) │  │  WebSocket      │         │
│  └──────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────┘
            │                 │
            ▼                 ▼
┌─────────────────────────────────────────────────┐
│              Backend Services                   │
│  - REST API (Port 8888)                         │
│  - WebSocket (Port 9000)                        │
└─────────────────────────────────────────────────┘
```

## 数据流说明

### 1. HTTP 请求流程
```
View Component
    │
    ├─> API Function (src/api/)
    │       │
    │       ├─> Axios Request (src/utils/request.ts)
    │       │       │
    │       │       ├─> Request Interceptor (添加 Token)
    │       │       │
    │       │       ├─> Backend API
    │       │       │
    │       │       ├─> Response Interceptor (处理响应)
    │       │       │
    │       │       └─> Return Data
    │       │
    │       └─> Return Promise
    │
    └─> Update View
```

### 2. WebSocket 消息流程
```
Chat Component
    │
    ├─> WebSocket Client (src/utils/websocket.ts)
    │       │
    │       ├─> Connect to WS Server
    │       │
    │       ├─> Send Message
    │       │
    │       ├─> Receive Message
    │       │       │
    │       │       └─> Message Handler
    │       │
    │       └─> Auto Reconnect (on disconnect)
    │
    └─> Update Message List
```

### 3. 状态管理流程
```
Component
    │
    ├─> Pinia Store Action
    │       │
    │       ├─> Call API
    │       │
    │       ├─> Update Store State
    │       │
    │       └─> Persist to LocalStorage (if needed)
    │
    └─> Store State Change
            │
            └─> Component Re-render
```

## 开发规范

### 命名规范
- **组件文件**: PascalCase (如 `UserList.vue`)
- **工具函数**: camelCase (如 `formatDate.ts`)
- **常量**: UPPER_SNAKE_CASE (如 `API_BASE_URL`)
- **接口类型**: PascalCase (如 `User`, `TodoItem`)

### 目录组织
- 按功能模块划分 (`views/todo/`, `views/user/`)
- 相关文件就近放置
- 公共组件放在 `components/`
- 业务组件放在各自模块下

### 代码风格
- 使用 TypeScript 严格模式
- 优先使用 Composition API
- 使用 `<script setup>` 语法
- 保持单一职责原则

## 性能优化

### 已实施优化
1. **路由懒加载**: 所有页面组件按需加载
2. **组件按需导入**: Element Plus 组件自动按需导入
3. **API 自动导入**: Vue、Router、Pinia API 自动导入
4. **代码分割**: 生产构建自动分割 vendor chunk

### 可扩展优化
1. **虚拟滚动**: 长列表使用虚拟滚动
2. **图片懒加载**: 图片资源懒加载
3. **CDN 加速**: 静态资源使用 CDN
4. **缓存策略**: 合理设置浏览器缓存

## 安全考虑

1. **XSS 防护**: Vue 自动转义输出
2. **CSRF 防护**: Token 认证机制
3. **输入验证**: 表单验证和后端验证
4. **HTTPS**: 生产环境使用 HTTPS
5. **Token 管理**: 安全存储和传输 Token

## 扩展指南

### 添加新模块
1. 在 `src/types/` 定义数据类型
2. 在 `src/api/` 创建 API 接口
3. 在 `src/views/` 创建页面组件
4. 在 `src/router/` 添加路由
5. 在布局菜单中添加导航

### 添加新状态
1. 在 `src/stores/` 创建新的 store
2. 定义 state、getters、actions
3. 在组件中使用 `useXxxStore()`

### 添加新工具
1. 在 `src/utils/` 创建工具文件
2. 导出纯函数
3. 添加 JSDoc 注释
4. 在需要的地方导入使用

## 相关文档

- [快速启动](./QUICKSTART.md) - 5分钟上手指南
- [项目说明](./README.md) - 完整项目文档
- [部署指南](./DEPLOYMENT.md) - 生产环境部署
- [更新日志](./CHANGELOG.md) - 版本更新记录
