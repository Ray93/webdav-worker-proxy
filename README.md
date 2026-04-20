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

## 本地调试

先创建本地 Secret 文件：

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` 只用于本地调试。当前仓库的 `wrangler.jsonc` 已经改成仅声明 `APP_KV` 绑定名，所以 `wrangler dev` 会自动准备本地 KV 数据，不需要你先去拿线上 KV ID。

推荐直接运行：

```bash
npm run dev:local
```

这个命令会同时：

- 监听 `src/admin/*`，持续重建到 `dist/`
- 启动 `wrangler dev`

启动后访问：

```text
http://127.0.0.1:8787/admin
```

如果你想分两个终端运行，也可以：

```bash
npm run dev:assets
npm run dev:worker
```

### 本地初始化流程

1. 执行 `npm run dev:local`
2. 打开 `http://127.0.0.1:8787/admin`
3. 创建管理员密码
4. 刷新页面
5. 因为 `.dev.vars` 中已经提供本地 `ADMIN_SESSION_SECRET`，页面会进入登录态流程
6. 使用刚才创建的管理员密码登录

### 清空本地状态

本地 KV 和 Worker 状态会写到 `.wrangler/`。如果你想重置本地密码和路由配置，删除它再重新启动：

```bash
rm -rf .wrangler/
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
- `npm run dev:local`: 同时启动前端资产监听和 Worker 本地服务
- `npm run dev:assets`: 只监听前端资产构建
- `npm run dev:worker`: 只启动 `wrangler dev`
- `npm run deploy`: 使用 Wrangler 部署
