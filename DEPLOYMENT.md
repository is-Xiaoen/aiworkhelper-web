# 部署指南

## 前提条件

1. 后端服务 AIWorkHelper 已成功部署并运行
2. Node.js 16+ 已安装
3. Nginx 或其他 Web 服务器（生产环境）

## 开发环境部署

### 1. 安装依赖

```bash
cd aiworkhelper-web
npm install
```

### 2. 配置环境变量

编辑 `.env.development`:

```env
VITE_APP_TITLE=AI工作助手
VITE_API_BASE_URL=http://127.0.0.1:8888
VITE_WS_BASE_URL=ws://127.0.0.1:9000
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 生产环境部署

### 方式一：传统部署

#### 1. 构建项目

```bash
npm run build
```

构建产物在 `dist` 目录。

#### 2. 配置 Nginx

创建 `/etc/nginx/sites-available/aiworkhelper-web`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/aiworkhelper-web/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /v1/ {
        proxy_pass http://127.0.0.1:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

#### 3. 部署文件

```bash
# 创建目录
sudo mkdir -p /var/www/aiworkhelper-web

# 复制构建产物
sudo cp -r dist/* /var/www/aiworkhelper-web/

# 设置权限
sudo chown -R www-data:www-data /var/www/aiworkhelper-web
sudo chmod -R 755 /var/www/aiworkhelper-web
```

#### 4. 启用站点

```bash
sudo ln -s /etc/nginx/sites-available/aiworkhelper-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 方式二：Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
# 构建阶段
FROM node:16-alpine as builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install --registry=https://registry.npmmirror.com

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 创建 nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
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

#### 3. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - aiworkhelper

  backend:
    # 后端服务配置
    # ...

networks:
  aiworkhelper:
    driver: bridge
```

#### 4. 构建并运行

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f frontend
```

### 方式三：使用 PM2

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 创建 ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'aiworkhelper-web',
    script: 'npx',
    args: 'vite preview --port 3000',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

#### 3. 启动应用

```bash
# 构建项目
npm run build

# 启动 PM2
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

## HTTPS 配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### Nginx HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... 其他配置
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 性能优化

### 1. 启用 Gzip 压缩

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
```

### 2. 浏览器缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN 加速

将静态资源部署到 CDN：

```typescript
// vite.config.ts
export default defineConfig({
  base: 'https://cdn.your-domain.com/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
```

## 监控和日志

### 1. Nginx 访问日志

```nginx
access_log /var/log/nginx/aiworkhelper-web.access.log;
error_log /var/log/nginx/aiworkhelper-web.error.log;
```

### 2. PM2 日志

```bash
# 查看日志
pm2 logs aiworkhelper-web

# 清空日志
pm2 flush

# 日志轮转
pm2 install pm2-logrotate
```

## 故障排查

### 1. 检查服务状态

```bash
# Nginx
sudo systemctl status nginx

# PM2
pm2 status

# Docker
docker-compose ps
```

### 2. 查看日志

```bash
# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# PM2 日志
pm2 logs

# Docker 日志
docker-compose logs -f frontend
```

### 3. 常见问题

**问题：页面空白，控制台报错**
- 检查 API 地址配置
- 检查后端服务是否运行
- 检查浏览器控制台错误

**问题：WebSocket 连接失败**
- 检查 WebSocket 代理配置
- 确认后端 WebSocket 服务运行
- 检查防火墙设置

**问题：路由刷新 404**
- 确认 Nginx 配置了 `try_files`
- 检查前端路由模式（应使用 history 模式）

## 回滚策略

### 1. 保留历史版本

```bash
# 备份当前版本
sudo cp -r /var/www/aiworkhelper-web /var/www/aiworkhelper-web.backup.$(date +%Y%m%d)

# 部署新版本
sudo cp -r dist/* /var/www/aiworkhelper-web/
```

### 2. 快速回滚

```bash
# 回滚到备份版本
sudo rm -rf /var/www/aiworkhelper-web
sudo cp -r /var/www/aiworkhelper-web.backup.20240101 /var/www/aiworkhelper-web
sudo systemctl reload nginx
```

## 自动化部署

### GitHub Actions 示例

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist/*"
          target: "/var/www/aiworkhelper-web"
```

## 联系支持

如遇部署问题，请：
1. 查看日志文件
2. 检查配置文件
3. 联系技术支持团队
