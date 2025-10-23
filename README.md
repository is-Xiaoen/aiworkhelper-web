# AIWorkHelper Web 前端项目

AIWorkHelper 的 Web 前端应用，基于 Vue 3 + TypeScript + Element Plus 构建的现代化企业级办公助手系统。

## 技术栈

- **框架**: Vue 3.4 + TypeScript 5.4
- **构建工具**: Vite 5.1
- **UI 组件库**: Element Plus 2.6
- **状态管理**: Pinia 2.1
- **路由**: Vue Router 4.3
- **HTTP 客户端**: Axios 1.6
- **日期处理**: Day.js 1.11
- **WebSocket**: 原生 WebSocket API

## 功能特性

### 核心功能

- ✅ **用户认证**: JWT Token 认证，路由守卫
- ✅ **待办事项管理**: 创建、编辑、删除、完成待办，支持多人协作
- ✅ **审批管理**: 请假、补卡、外出等审批流程
- ✅ **部门管理**: 组织架构树形管理，部门成员设置
- ✅ **用户管理**: 用户增删改查，权限管理
- ✅ **AI 助手**:
  - 智能对话
  - 待办查询/添加
  - 审批查询
  - 群消息总结
- ✅ **实时通讯**: 基于 WebSocket 的群聊和私聊
- ✅ **文件上传**: 图片上传和预览

### 技术特性

- 🎨 响应式设计，支持桌面端和移动端
- 🔐 完整的权限认证体系
- 🚀 路由懒加载，优化首屏加载
- 📦 自动导入 Vue 组件和 API
- 🔄 WebSocket 自动重连机制
- 💡 TypeScript 类型安全
- 🎯 统一的错误处理和提示

## 目录结构

```
aiworkhelper-web/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 接口定义
│   │   ├── user.ts        # 用户相关接口
│   │   ├── todo.ts        # 待办事项接口
│   │   ├── approval.ts    # 审批接口
│   │   ├── department.ts  # 部门接口
│   │   ├── chat.ts        # AI 聊天接口
│   │   └── upload.ts      # 文件上传接口
│   ├── assets/            # 资源文件
│   ├── components/        # 公共组件
│   ├── layout/            # 布局组件
│   │   └── Index.vue      # 主布局
│   ├── router/            # 路由配置
│   │   └── index.ts       # 路由定义和守卫
│   ├── stores/            # Pinia 状态管理
│   │   └── user.ts        # 用户状态
│   ├── styles/            # 全局样式
│   │   └── index.css      # 全局样式文件
│   ├── types/             # TypeScript 类型定义
│   │   └── index.ts       # 所有类型定义
│   ├── utils/             # 工具函数
│   │   ├── request.ts     # Axios 封装
│   │   └── websocket.ts   # WebSocket 封装
│   ├── views/             # 页面组件
│   │   ├── Login.vue      # 登录页
│   │   ├── Dashboard.vue  # 工作台
│   │   ├── todo/          # 待办事项
│   │   ├── approval/      # 审批管理
│   │   ├── department/    # 部门管理
│   │   ├── user/          # 用户管理
│   │   └── chat/          # AI 聊天
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── .env.development       # 开发环境配置
├── .env.production        # 生产环境配置
├── index.html             # HTML 模板
├── package.json           # 项目依赖
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── README.md              # 项目文档
```

## 快速开始

### 环境要求

- Node.js >= 16.0
- npm >= 8.0 或 pnpm >= 7.0

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
```

构建产物在 `dist` 目录

### 预览构建

```bash
npm run preview
```

## 配置说明

### 环境变量

开发环境 (`.env.development`):
```env
VITE_APP_TITLE=AI工作助手
VITE_API_BASE_URL=http://127.0.0.1:8888
VITE_WS_BASE_URL=ws://127.0.0.1:9000
```

生产环境 (`.env.production`):
```env
VITE_APP_TITLE=AI工作助手
VITE_API_BASE_URL=http://your-production-domain.com
VITE_WS_BASE_URL=ws://your-production-domain.com:9000
```

### 代理配置

开发环境下，API 请求会通过 Vite 代理转发到后端服务：

```typescript
// vite.config.ts
server: {
  port: 3000,
  proxy: {
    '/v1': {
      target: 'http://127.0.0.1:8888',
      changeOrigin: true
    }
  }
}
```

## API 接口适配

所有接口完全适配后端 AIWorkHelper 项目，请参考后端 API 文档：[API_INVENTORY.md](../AIWorkHelper/API_INVENTORY.md)

### 统一响应格式

```typescript
{
  code: 200,          // 200: 成功, 500: 失败
  data: {},           // 响应数据
  msg: "success"      // 响应消息
}
```

### 认证方式

所有需要认证的请求会自动在请求头中添加 JWT Token：

```typescript
Authorization: Bearer <token>
```

## WebSocket 连接

### 连接方式

```typescript
// 自动连接到后端 WebSocket 服务
const wsClient = createWebSocket(token)
await wsClient.connect()
```

### 消息格式

```typescript
{
  conversationId: string,  // 会话ID: "all" 为群聊
  recvId: string,          // 接收者ID
  sendId: string,          // 发送者ID
  chatType: number,        // 1: 群聊, 2: 私聊
  content: string,         // 消息内容
  contentType: number      // 1: 文字, 2: 图片
}
```

## 页面功能说明

### 登录页 (`/login`)
- 用户名密码登录
- 表单验证
- JWT Token 存储

### 工作台 (`/dashboard`)
- 数据统计卡片
- 待办事项快览
- 审批申请快览
- 快速操作入口

### 待办事项 (`/todo`)
- 待办列表展示
- 创建/编辑待办
- 完成待办
- 添加操作记录
- 时间筛选

### 审批管理 (`/approval`)
- 审批列表
- 发起审批（请假、补卡、外出）
- 审批处理（通过/拒绝）
- 审批详情查看

### 部门管理 (`/department`)
- 部门树形展示
- 创建/编辑部门
- 设置部门成员
- 部门详情查看

### 用户管理 (`/user`)
- 用户列表
- 创建/编辑用户
- 用户状态管理
- 用户搜索

### AI 助手 (`/chat`)
- AI 智能对话
- 待办查询/添加
- 审批查询
- 群消息总结
- 群聊功能
- 图片发送
- 实时消息推送

## 开发指南

### 添加新页面

1. 在 `src/views/` 创建页面组件
2. 在 `src/router/index.ts` 添加路由
3. 在主布局菜单中添加导航

### 添加新 API

1. 在 `src/types/index.ts` 定义类型
2. 在 `src/api/` 创建 API 文件
3. 在页面中导入使用

### 状态管理

使用 Pinia 管理全局状态：

```typescript
import { defineStore } from 'pinia'

export const useMyStore = defineStore('my-store', () => {
  const state = ref({})

  const actions = () => {}

  return { state, actions }
})
```

## 部署指南

### Docker 部署

```dockerfile
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /v1/ {
        proxy_pass http://backend:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://backend:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 常见问题

### 1. WebSocket 连接失败？

检查：
- 后端 WebSocket 服务是否启动（端口 9000）
- 环境变量 `VITE_WS_BASE_URL` 是否正确
- 浏览器控制台是否有错误信息

### 2. API 请求失败？

检查：
- 后端 API 服务是否启动（端口 8888）
- 环境变量 `VITE_API_BASE_URL` 是否正确
- Token 是否有效

### 3. 图标不显示？

Element Plus 图标需要单独导入：
```typescript
import { Edit, Delete } from '@element-plus/icons-vue'
```

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

MIT License

## 联系方式

如有问题，请联系开发团队或提交 Issue。
