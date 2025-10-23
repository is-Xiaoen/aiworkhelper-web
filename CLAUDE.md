# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AIWorkHelper Web 是一个企业级办公助手系统的前端应用，采用 Vue 3 + TypeScript + Element Plus 技术栈。该项目提供待办事项管理、审批流程、部门管理、AI 助手以及实时通讯等功能。

## 开发命令

### 基础命令
- `npm run dev` - 启动开发服务器（端口 3000）
- `npm run build` - 构建生产环境代码（执行 TypeScript 类型检查 + Vite 构建）
- `npm run preview` - 预览生产构建结果
- `npm run lint` - 运行 ESLint 检查并自动修复

### 依赖管理
- `npm install` - 安装项目依赖（推荐使用 pnpm）

## 核心架构

### 1. 请求拦截与认证
- HTTP 请求通过 `src/utils/request.ts` 中的 Axios 实例统一处理
- 自动在请求头添加 JWT Token: `Authorization: Bearer <token>`
- 统一响应格式: `{ code: 200, data: {}, msg: "success" }`
- 401 错误会自动清除 token 并跳转到登录页

### 2. WebSocket 实时通讯
- WebSocket 客户端封装在 `src/utils/websocket.ts`
- 支持自动重连（最多 5 次，间隔递增）
- 支持心跳机制（每 30 秒一次）
- 消息类型定义在 `src/types/index.ts` 中的 `WsMessage` 接口
- 连接地址通过环境变量 `VITE_WS_BASE_URL` 配置

### 3. 路由与权限
- 路由配置在 `src/router/index.ts`
- 使用路由守卫检查认证状态（meta.requiresAuth）
- 集成 NProgress 进度条
- 所有页面组件采用懒加载方式

### 4. 状态管理
- 使用 Pinia 进行状态管理
- 用户状态（token、用户信息）存储在 `src/stores/user.ts`
- 支持组合式 API 风格

### 5. 自动导入配置
- 通过 `unplugin-auto-import` 自动导入 Vue、Vue Router、Pinia API
- 通过 `unplugin-vue-components` 自动导入 Element Plus 组件
- 配置在 `vite.config.ts` 中

## 环境配置

### 开发环境 (.env.development)
- API 基础地址: `http://127.0.0.1:8888`
- WebSocket 地址: `ws://127.0.0.1:9000`
- 开发服务器端口: 3000
- API 代理配置: `/v1` 路径代理到后端 8888 端口

### 生产环境 (.env.production)
需要配置实际的生产环境域名

## 类型系统

所有类型定义集中在 `src/types/index.ts`，包括：
- API 响应类型 (`ApiResponse`, `PageData`)
- 业务实体类型 (`User`, `Todo`, `Approval`, `Department`)
- 请求参数类型 (各种 `*Request`, `*Params`)
- WebSocket 消息类型 (`WsMessage`)

## API 接口组织

API 接口按功能模块分类在 `src/api/` 目录：
- `user.ts` - 用户认证与管理
- `todo.ts` - 待办事项
- `approval.ts` - 审批流程
- `department.ts` - 部门管理
- `chat.ts` - AI 聊天
- `upload.ts` - 文件上传

所有接口函数返回类型化的 `ApiResponse<T>`

## 页面组件结构

主要页面位于 `src/views/`：
- 使用 `src/layout/Index.vue` 作为主布局容器
- 各功能模块采用独立目录（如 `todo/`, `approval/`）
- 页面间通过 Vue Router 进行导航

## 后端集成说明

- 后端 API 服务运行在 8888 端口
- WebSocket 服务运行在 9000 端口
- 完全适配 AIWorkHelper 后端项目接口规范
- 支持群聊（conversationId: "all"）和私聊功能

## 开发注意事项

### 添加新功能时
1. 在 `src/types/index.ts` 定义相关类型
2. 在 `src/api/` 创建对应的接口函数
3. 在 `src/views/` 创建页面组件
4. 在 `src/router/index.ts` 注册路由

### WebSocket 使用
```typescript
import { createWebSocket } from '@/utils/websocket'
const wsClient = createWebSocket(token)
await wsClient.connect()
wsClient.onMessage((message) => { /* 处理消息 */ })
```

### 认证状态处理
- 使用 `useUserStore()` 访问用户状态
- Token 会自动添加到所有 HTTP 请求头
- 401 响应会自动触发登出并跳转登录页
