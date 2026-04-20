# WebDAV Worker Proxy

基于 Cloudflare Worker 的 WebDAV 中转代理，附带一个 React 管理台，用于维护多条前缀路由、目标基地址和自定义请求头。

## 特性

- 支持多对多 WebDAV 转发路由，按最长前缀命中
- 支持为每条路由配置：
  - 前缀
  - 是否去除前缀
  - 固定目标基地址
  - 自定义请求头
  - 启用 / 停用状态
- 首次打开 `/admin` 时创建管理员密码，并生成 `ADMIN_SESSION_SECRET`
- 通过 `HttpOnly` Cookie 维持管理员会话
- 对 WebDAV 常见场景做了 `Destination` / `Location` 头重写
- 管理台基于 `Vite 8 + React 19`，Worker 运行时基于 `Wrangler 4.83`

## 本地开发

```bash
npm install
npm test
npm run typecheck
npm run build
```

## Cloudflare 绑定

- `APP_KV`: 存储管理员密码哈希和代理路由
- `ADMIN_SESSION_SECRET`: 管理员会话签名密钥

## 首次初始化

1. 部署 Worker 与 KV 绑定。
2. 打开 `/admin`。
3. 创建管理员密码。
4. 复制页面展示的 `ADMIN_SESSION_SECRET` 值。
5. 使用 Wrangler 或 Cloudflare 控制台把它配置成 Worker Secret。
6. 返回 `/admin`，点击“我已完成”或直接刷新页面。
7. 页面检测到 Secret 生效后，会进入密码登录页。

## 常用命令

- `npm test`: 运行 Worker 与 Admin 测试
- `npm run typecheck`: TypeScript 类型检查
- `npm run build`: 打包 Admin 资产到 `dist/`
- `npm run deploy`: 使用 Wrangler 部署
