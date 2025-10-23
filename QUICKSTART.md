# 快速启动指南

## 5分钟快速体验

### 第一步：确认后端服务运行

确保 AIWorkHelper 后端服务已启动：

```bash
cd ../AIWorkHelper
go run main.go -f ./etc/api.yaml -m api
```

后端服务应该运行在：
- API: http://127.0.0.1:8888
- WebSocket: ws://127.0.0.1:9000

### 第二步：安装前端依赖

```bash
cd aiworkhelper-web
npm install
```

如果网络较慢，建议使用国内镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

### 第三步：启动开发服务器

```bash
npm run dev
```

看到类似输出表示成功：
```
VITE v5.1.5  ready in 1234 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 第四步：访问应用

打开浏览器访问：http://localhost:3000

默认测试账号（需要在后端创建）：
- 用户名：admin
- 密码：123456

## 功能快速体验

### 1. 登录系统
使用测试账号登录系统

### 2. 查看工作台
登录后自动跳转到工作台，可以看到：
- 待办事项统计
- 审批申请统计
- 快速操作入口

### 3. 体验待办管理
1. 点击左侧菜单"待办事项"
2. 点击"新增待办"按钮
3. 填写待办信息并保存
4. 在列表中查看、编辑或完成待办

### 4. 体验审批功能
1. 点击左侧菜单"审批管理"
2. 点击"发起审批"
3. 选择审批类型（请假/补卡/外出）
4. 填写审批信息并提交
5. 在列表中处理审批（通过/拒绝）

### 5. 体验 AI 助手
1. 点击左侧菜单"AI助手"
2. 在输入框中输入：
   - "你好" - 测试默认对话
   - "查询我的待办" - 测试待办查询
   - "帮我创建一个明天的待办：完成报告" - 测试待办添加
3. 切换到"群聊"可以体验实时通讯

### 6. 管理组织架构
1. 点击"部门管理" - 创建和管理部门
2. 点击"用户管理" - 创建和管理用户

## 常见问题

### Q: 启动失败，提示端口被占用？
A: 修改 `vite.config.ts` 中的端口：
```typescript
server: {
  port: 3001  // 改为其他端口
}
```

### Q: API 请求失败？
A: 检查：
1. 后端服务是否正常运行
2. 后端服务端口是否为 8888
3. 控制台是否有 CORS 错误

### Q: WebSocket 连接失败？
A: 检查：
1. 后端 WebSocket 服务是否运行在 9000 端口
2. 浏览器控制台是否有连接错误
3. 是否已登录（WebSocket 需要 Token）

### Q: 页面空白或报错？
A: 尝试：
1. 清除浏览器缓存
2. 删除 `node_modules` 重新安装
3. 检查浏览器控制台错误信息

### Q: 如何创建第一个用户？
A: 有两种方式：
1. 使用后端 API 直接创建：
```bash
curl -X POST http://127.0.0.1:8888/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","password":"123456"}'
```

2. 通过 MongoDB 直接插入用户数据

## 开发技巧

### 热重载
开发模式下支持热重载，修改代码后会自动刷新页面。

### 调试工具
推荐安装 Vue DevTools 浏览器扩展：
- Chrome: https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/

### API 调试
开发环境下，可以在浏览器控制台查看所有 API 请求：
- Network 面板查看请求和响应
- Axios 请求会自动打印日志

### 快捷键
- Ctrl + Enter: 在聊天界面发送消息

## 下一步

现在你已经成功启动并体验了 AIWorkHelper 前端应用！

继续探索：
- 📖 阅读完整的 [README.md](./README.md)
- 🚀 查看 [部署指南](./DEPLOYMENT.md)
- 📝 了解 [更新日志](./CHANGELOG.md)
- 🔧 自定义配置和功能

## 反馈问题

如有问题或建议：
1. 查看文档和常见问题
2. 查看浏览器控制台错误
3. 查看后端日志
4. 联系开发团队

祝使用愉快！🎉
