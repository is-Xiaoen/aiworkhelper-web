# 后端地址配置指南

本文档详细说明了在修改后端服务地址时，需要更新的所有配置文件及具体代码位置。

## 1. 开发环境 (Development)

在运行 `npm run dev` 或 `pnpm dev` 时生效。

### HTTP API 地址

主要通过 Vite 代理配置，将本地请求转发到后端。

- **文件**: `vite.config.ts`
- **位置**: 第 27-32 行 (proxy 配置块)
- **修改方式**: 修改 `target` 字段的值。
  ```typescript
  proxy: {
    '/v1': {
      target: 'http://2b84ec1c.r30.cpolar.top', // <--- 修改此处
      changeOrigin: true
    }
  }
  ```

### WebSocket 地址

直接连接 WebSocket 服务。

- **文件**: `.env.development`
- **位置**: 第 5 行
- **修改方式**: 修改 `VITE_WS_BASE_URL` 的值。
  ```properties
  VITE_WS_BASE_URL=ws://630e6f70.r30.cpolar.top
  ```

---

## 2. 生产环境 (Production)

在运行 `npm run build` 构建打包后生效。

### HTTP API & WebSocket 地址

生产环境通常不经过 Vite 代理，直接请求目标地址。

- **文件**: `.env.production`
- **位置**: 第 3-4 行
- **修改方式**:
  ```properties
  VITE_API_BASE_URL=http://your-production-domain.com      # <--- 修改 HTTP 域名
  VITE_WS_BASE_URL=ws://your-production-domain.com:9000    # <--- 修改 WS 域名
  ```

---

## 3. 核心代码引用说明 (仅供查阅)

以下文件包含了读取上述配置的逻辑，通常**不需要修改**，除非你要更改配置读取的策略。

### HTTP 请求基础路径逻辑

- **文件**: `src/utils/request.ts`
  - **位置**: 第 8 行
  - **代码**: `baseURL: import.meta.env.MODE === 'development' ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8888')`

### SSE (流式消息) 请求逻辑

- **文件**: `src/api/aiConversation.ts`
  - **位置**: 第 117-119 行
  - **代码**: 同上，独立实现了 baseURL 获取逻辑。

### WebSocket 连接逻辑

- **文件**: `src/utils/websocket.ts`
  - **位置**: 第 171 行
  - **代码**: `const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:9000'`
