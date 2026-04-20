# Admin Console Swiss Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改动初始化、登录、规则管理和路由编辑功能流的前提下，把管理台前端重构为 `Swiss Workbench` 视觉风格，并保持测试通过。

**Architecture:** 实现分成三层推进。先更新前端测试，让它们对新的视觉标题和关键文案产生失败，再分别调整页面 JSX 结构和全局样式，最后跑测试、类型检查和构建。页面逻辑、API 调用和状态流不动，所有改动集中在 `src/admin` 视图层和 `tests/admin` 前端测试层。

**Tech Stack:** Vite 8, React 19, TypeScript, Radix Dialog, shadcn/ui 风格约束, Vitest, Testing Library, plain CSS

---

## File Structure

- Modify: `src/admin/styles.css`
  - 重写颜色变量、字体导入、页面骨架、卡片、按钮、表单、状态标签、弹窗、响应式规则
- Modify: `src/admin/App.tsx`
  - 仅调整加载页文案或标题，不改变状态流
- Modify: `src/admin/features/bootstrap/bootstrap-page.tsx`
  - 保留双栏流程，重组初始化页视觉层级
- Modify: `src/admin/features/auth/login-page.tsx`
  - 保留双栏登录流程，统一视觉结构
- Modify: `src/admin/features/routes/routes-page.tsx`
  - 调整规则页页头、摘要卡片、规则卡片的视觉层级
- Modify: `src/admin/features/routes/route-form-dialog.tsx`
  - 调整弹窗视觉结构与辅助文案，不改交互逻辑
- Modify: `tests/admin/app.test.tsx`
  - 断言新的初始化入口标题，保证启动逻辑未变
- Modify: `tests/admin/bootstrap-page.test.tsx`
  - 断言新的初始化页视觉标题和 Secret 区标题
- Modify: `tests/admin/login-page.test.tsx`
  - 断言新的登录标题和密码表单仍然存在
- Modify: `tests/admin/routes-page.test.tsx`
  - 断言新的规则页标题、空态或卡片区仍能渲染

## Guardrails

- 不改 Worker 代码
- 不改 `src/admin/lib/api.ts`
- 不改 bootstrap / login / route CRUD 逻辑
- 不新增组件库依赖
- 不提交代码，等用户本地确认后再决定是否提交

---

### Task 1: Update Admin Tests First

**Files:**
- Modify: `tests/admin/app.test.tsx`
- Modify: `tests/admin/bootstrap-page.test.tsx`
- Modify: `tests/admin/login-page.test.tsx`
- Modify: `tests/admin/routes-page.test.tsx`

- [ ] **Step 1: Rewrite `tests/admin/bootstrap-page.test.tsx` to target the new Swiss Workbench headings**

Replace the current assertions with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BootstrapPage } from "../../src/admin/features/bootstrap/bootstrap-page";

describe("BootstrapPage", () => {
  it("shows the swiss workbench bootstrap headings and secret action", () => {
    render(
      <BootstrapPage
        state="confirm_secret"
        secretName="ADMIN_SESSION_SECRET"
        generatedSecret="abc123"
        onSubmit={vi.fn(async () => undefined)}
        onRefresh={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("heading", { name: "先完成管理台初始化" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "继续完成安全密钥设置" })).toBeInTheDocument();
    expect(screen.getAllByText("ADMIN_SESSION_SECRET")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "我已完成" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rewrite `tests/admin/login-page.test.tsx` to target the new login hero**

Replace the current assertions with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../../src/admin/features/auth/login-page";

describe("LoginPage", () => {
  it("renders the swiss workbench login form", () => {
    render(<LoginPage pending={false} onSubmit={vi.fn(async () => undefined)} />);

    expect(screen.getByRole("heading", { name: "进入转发管理台" })).toBeInTheDocument();
    expect(
      screen.getByText("在一个页面里维护所有转发规则，统一管理目标地址、路径处理方式和附加请求头。"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("管理员密码")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rewrite `tests/admin/routes-page.test.tsx` to target the new workbench page header**

Replace the current file with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoutesPage } from "../../src/admin/features/routes/routes-page";

describe("RoutesPage", () => {
  it("renders swiss workbench route cards and exposes create action", () => {
    render(
      <RoutesPage
        routes={[
          {
            id: "1",
            prefix: "/dav",
            stripPrefix: true,
            targetBaseUrl: "https://dav.example.com/root",
            customHeaders: [{ name: "x-upstream-token", value: "abc" }],
            enabled: true,
            createdAt: "",
            updatedAt: "",
          },
        ]}
        onCreate={vi.fn(async () => undefined)}
        onEdit={vi.fn(async () => undefined)}
        onToggle={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onLogout={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("heading", { name: "统一管理转发规则" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "规则会按访问路径自动匹配到对应目标地址。你可以在这里统一维护前缀、路径处理方式和附加请求头。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("/dav")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增路由" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑" })).toBeInTheDocument();
  });

  it("shows the new empty-state guidance", () => {
    render(
      <RoutesPage
        routes={[]}
        onCreate={vi.fn(async () => undefined)}
        onEdit={vi.fn(async () => undefined)}
        onToggle={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onLogout={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByText("先添加第一条转发规则")).toBeInTheDocument();
    expect(screen.getByText("从一个访问前缀开始，把请求转发到正确的目标地址。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Rewrite `tests/admin/app.test.tsx` to verify the first-screen heading changed but bootstrap fetch count stays the same**

Update the final assertion block to:

```tsx
render(<App />);

expect(await screen.findByRole("heading", { name: "创建登录密码" })).toBeInTheDocument();

await waitFor(() => {
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 5: Run the admin tests to verify they fail for the right reason**

Run:

```bash
npm run test:admin
```

Expected:

```text
FAIL tests/admin/bootstrap-page.test.tsx
FAIL tests/admin/login-page.test.tsx
FAIL tests/admin/routes-page.test.tsx
```

The failures should complain that the new headings or text do not exist yet.

---

### Task 2: Rebuild the Page JSX Hierarchy Without Changing Behavior

**Files:**
- Modify: `src/admin/App.tsx`
- Modify: `src/admin/features/bootstrap/bootstrap-page.tsx`
- Modify: `src/admin/features/auth/login-page.tsx`
- Modify: `src/admin/features/routes/routes-page.tsx`
- Modify: `src/admin/features/routes/route-form-dialog.tsx`

- [ ] **Step 1: Update the loading screen copy in `src/admin/App.tsx`**

Change `LoadingScreen()` to:

```tsx
function LoadingScreen() {
  return (
    <main className="page-shell">
      <section className="hero-card loading-card">
        <span className="eyebrow-pill">准备中</span>
        <h1>正在打开管理台</h1>
        <p className="hero-text">正在读取配置和登录状态，请稍候。</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Rebuild the bootstrap page hero structure in `src/admin/features/bootstrap/bootstrap-page.tsx`**

Replace the current left-column and panel headings with this structure:

```tsx
<div className="hero-copy hero-copy-spacious">
  <span className="eyebrow-pill">开始设置</span>
  <h1>先完成管理台初始化</h1>
  <p className="hero-text">
    先创建一个管理员密码，再按页面提示完成安全密钥配置。做完这一步，刷新页面就可以进入登录页。
  </p>
  <div className="info-stack">
    <article className="info-card">
      <span className="info-label">接下来</span>
      <p>创建密码，复制系统生成的密钥，再去 Cloudflare 控制台或 Wrangler 完成配置。</p>
    </article>
    <article className="info-card">
      <span className="info-label">完成后</span>
      <p>页面检测到运行时 Secret 后，会自动进入密码登录页面，不需要额外切换。</p>
    </article>
    <article className="info-card info-card-wide">
      <span className="info-label">固定变量名</span>
      <p className="secret-name">ADMIN_SESSION_SECRET</p>
    </article>
  </div>
</div>
```

For the uninitialized panel heading and helper block, replace the top of the form with:

```tsx
<div className="panel-header">
  <span className="section-tag">第一步</span>
  <h2>创建登录密码</h2>
  <p>这个密码只用于进入管理台，不会附加到转发请求里。</p>
</div>

<div className="support-note">
  <strong>建议保存好这组密码。</strong>
  <p>后续登录、调整转发规则、管理请求头时都会用到它。</p>
</div>
```

For the confirm-secret panel heading and support block, replace it with:

```tsx
<div className="panel-header">
  <span className="section-tag">第二步</span>
  <h2>继续完成安全密钥设置</h2>
  <p>
    {secretReady
      ? "复制下面这组值，到 Cloudflare 控制台或 Wrangler 中完成 Secret 配置。"
      : "当前还没有检测到运行时 Secret。请使用你保存的值完成配置，然后回来刷新页面。"}
  </p>
</div>
```

And after the secret/callout block, add:

```tsx
<div className="support-note">
  <strong>完成配置后有两种返回方式。</strong>
  <p>可以点“我已完成”立即检测，也可以直接刷新页面，系统会自动判断是否已经配置成功。</p>
</div>
```

- [ ] **Step 3: Rebuild the login page hero in `src/admin/features/auth/login-page.tsx`**

Replace the left column with:

```tsx
<div className="hero-copy hero-copy-spacious">
  <span className="eyebrow-pill">管理入口</span>
  <h1>进入转发管理台</h1>
  <p className="hero-text">
    在一个页面里维护所有转发规则，统一管理目标地址、路径处理方式和附加请求头。
  </p>
  <div className="info-stack">
    <article className="info-card">
      <span className="info-label">统一管理</span>
      <p>支持多条路由并行生效，系统会优先匹配更具体的访问路径。</p>
    </article>
    <article className="info-card">
      <span className="info-label">减少重复操作</span>
      <p>常见 WebDAV 请求头会随规则一起保存，下次调整时不需要重新输入。</p>
    </article>
  </div>
</div>
```

Replace the form header with:

```tsx
<div className="panel-header">
  <span className="section-tag">登录</span>
  <h2>输入管理密码</h2>
  <p>只需要输入你设置过的密码，登录状态会保留在当前浏览器里。</p>
</div>
```

Add this helper block before the error message:

```tsx
<div className="support-note">
  <strong>如果页面回到初始化流程。</strong>
  <p>通常表示运行时 Secret 被删除或尚未配置，需要重新完成初始化设置。</p>
</div>
```

- [ ] **Step 4: Rebuild the routes page header and card hierarchy in `src/admin/features/routes/routes-page.tsx`**

Replace the dashboard header block with:

```tsx
<div className="dashboard-header">
  <div className="dashboard-copy">
    <span className="eyebrow-pill">规则中心</span>
    <h1>统一管理转发规则</h1>
    <p className="hero-text">
      规则会按访问路径自动匹配到对应目标地址。你可以在这里统一维护前缀、路径处理方式和附加请求头。
    </p>
  </div>
  <div className="header-actions">
    <button className="ghost-button" onClick={() => void props.onLogout()} type="button">
      退出登录
    </button>
    <button className="primary-button" onClick={() => setDialogState({ mode: "create" })} type="button">
      新增路由
    </button>
  </div>
</div>
```

Replace the summary cards with:

```tsx
<div className="summary-grid">
  <article className="summary-card">
    <span className="summary-label">规则总数</span>
    <strong>{props.routes.length}</strong>
    <p>当前已保存的转发配置</p>
  </article>
  <article className="summary-card">
    <span className="summary-label">已启用</span>
    <strong>{props.routes.filter((route) => route.enabled).length}</strong>
    <p>正在参与匹配与转发</p>
  </article>
  <article className="summary-card">
    <span className="summary-label">保留原路径</span>
    <strong>{props.routes.filter((route) => !route.stripPrefix).length}</strong>
    <p>请求路径会连同前缀一并转发</p>
  </article>
</div>
```

Replace the empty state with:

```tsx
<article className="route-card route-card-empty">
  <span className="empty-pill">从这里开始</span>
  <h2>先添加第一条转发规则</h2>
  <p>从一个访问前缀开始，把请求转发到正确的目标地址。</p>
</article>
```

Replace the route card head/content structure with:

```tsx
<div className="route-card-head">
  <div className="route-title-group">
    <span className="route-label">访问前缀</span>
    <h2>{route.prefix}</h2>
  </div>
  <span className={route.enabled ? "status-pill is-enabled" : "status-pill"}>
    {route.enabled ? "启用中" : "已停用"}
  </span>
</div>

<div className="route-destination">
  <span className="route-label">目标地址</span>
  <p>{route.targetBaseUrl}</p>
</div>

<div className="route-metadata">
  <span className="meta-pill">
    {route.stripPrefix ? "去除前缀后转发" : "保留前缀后转发"}
  </span>
  <span className="meta-pill">{route.customHeaders.length} 个附加请求头</span>
</div>
```

Add the request-header title before the `code` list:

```tsx
<div className="header-preview">
  <span className="route-label">附加请求头</span>
  {route.customHeaders.map((header) => (
    <code key={`${route.id}-${header.name}`}>
      {header.name}: {header.value}
    </code>
  ))}
</div>
```

- [ ] **Step 5: Rebuild the dialog header and field helper hierarchy in `src/admin/features/routes/route-form-dialog.tsx`**

Replace the dialog header with:

```tsx
<div className="dialog-header">
  <div>
    <span className="section-tag">路由编辑</span>
    <Dialog.Title className="dialog-title">{props.title}</Dialog.Title>
    <Dialog.Description className="dialog-description">
      按顺序填写访问前缀、目标地址和附加请求头，保存后规则会立刻出现在列表中。
    </Dialog.Description>
  </div>
  <Dialog.Close className="ghost-button" type="button">
    关闭
  </Dialog.Close>
</div>
```

Add these helper texts under each field:

```tsx
<p className="field-hint">访问这个前缀时，请求会命中当前这条转发规则。</p>
```

```tsx
<p className="field-hint">这里填写远端 WebDAV 服务的固定基地址。</p>
```

```tsx
<p className="field-hint">
  适合放认证信息或上游服务要求的固定请求头。没有需求时可以留空。
</p>
```

- [ ] **Step 6: Run the admin tests again to confirm JSX and copy changes satisfy the new assertions**

Run:

```bash
npm run test:admin
```

Expected:

```text
PASS tests/admin/bootstrap-page.test.tsx
PASS tests/admin/login-page.test.tsx
PASS tests/admin/routes-page.test.tsx
```

The suite may still fail at this point for CSS-independent issues only; if it fails, fix JSX before moving to Task 3.

---

### Task 3: Rewrite CSS Into Swiss Workbench

**Files:**
- Modify: `src/admin/styles.css`

- [ ] **Step 1: Replace the font import and root variables**

Replace the top of `src/admin/styles.css` with:

```css
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700&display=swap");

:root {
  color: #111111;
  background:
    radial-gradient(circle at top left, rgba(210, 218, 231, 0.32), transparent 24%),
    radial-gradient(circle at top right, rgba(227, 232, 240, 0.44), transparent 28%),
    linear-gradient(180deg, #fbfbfa 0%, #f2f3ef 100%);
  font-family: "Manrope", "Helvetica Neue", Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --page-border: rgba(17, 17, 17, 0.08);
  --panel-border: rgba(17, 17, 17, 0.1);
  --panel-soft: #f6f5f2;
  --panel-muted: #efeee9;
  --panel-strong: #ffffff;
  --text-primary: #111111;
  --text-secondary: #515151;
  --text-muted: #7b7b74;
  --accent: #0369a1;
  --accent-soft: rgba(3, 105, 161, 0.1);
  --danger: #a14f48;
  --shadow-soft: 0 20px 60px rgba(17, 17, 17, 0.06);
  --shadow-panel: 0 12px 30px rgba(17, 17, 17, 0.04);
}
```

- [ ] **Step 2: Replace the page-shell, hero-card, hero-copy, hero-panel, heading, and text rules**

Use these rules:

```css
.page-shell {
  min-height: 100vh;
  padding: 28px 18px 56px;
}

.hero-card,
.dialog-card {
  width: min(1180px, 100%);
  margin: 0 auto;
  border: 1px solid var(--page-border);
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.hero-card {
  padding: 22px;
}

.hero-card-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 410px);
  gap: 20px;
}

.hero-copy {
  display: grid;
  align-content: space-between;
  gap: 26px;
  min-height: 640px;
  padding: 36px;
  border: 1px solid var(--panel-border);
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 244, 239, 0.96));
}

.hero-copy-spacious {
  align-content: start;
}

.hero-panel {
  min-height: 100%;
  padding: 32px;
  border: 1px solid var(--panel-border);
  border-radius: 26px;
  background: rgba(252, 252, 250, 0.96);
  box-shadow: var(--shadow-panel);
}

.hero-copy h1,
.dashboard-header h1,
.loading-card h1 {
  margin: 0;
  max-width: 11ch;
  font-family: "Sora", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: clamp(3rem, 6vw, 5.4rem);
  line-height: 1.02;
  letter-spacing: -0.06em;
}

.hero-text {
  max-width: 44rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: 1.06rem;
  line-height: 1.75;
}
```

- [ ] **Step 3: Replace the shared pill, card, button, input, and status rules**

Use these rules:

```css
.eyebrow-pill,
.status-pill,
.meta-pill,
.empty-pill,
.section-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.eyebrow-pill,
.section-tag,
.empty-pill {
  color: #334155;
  background: #eef2f7;
}

.status-pill,
.meta-pill {
  border: 1px solid rgba(17, 17, 17, 0.08);
  background: #f7f8fa;
  color: #475569;
}

.status-pill.is-enabled {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: rgba(3, 105, 161, 0.16);
}

.primary-button,
.ghost-button,
.segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 999px;
  padding: 0 18px;
  font-size: 0.94rem;
  font-weight: 700;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms ease,
    opacity 180ms ease;
}

.primary-button {
  border: 1px solid transparent;
  background: #0f172a;
  color: #ffffff;
}

.ghost-button {
  border: 1px solid rgba(17, 17, 17, 0.12);
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-primary);
}

.ghost-button-danger {
  color: var(--danger);
}

.field input,
.header-row input {
  width: 100%;
  min-height: 52px;
  border: 1px solid rgba(17, 17, 17, 0.12);
  border-radius: 16px;
  padding: 0 16px;
  background: #ffffff;
  color: var(--text-primary);
}

.field input:focus,
.header-row input:focus {
  outline: none;
  border-color: rgba(3, 105, 161, 0.45);
  box-shadow: 0 0 0 4px rgba(3, 105, 161, 0.12);
}
```

- [ ] **Step 4: Replace the dashboard, route-card, dialog, helper-card, and responsive rules**

Use these rules:

```css
.dashboard-shell,
.route-list,
.stack-form,
.header-list {
  display: grid;
  gap: 16px;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 10px 10px;
}

.dashboard-copy,
.route-title-group,
.route-destination,
.panel-header,
.dialog-header,
.support-note {
  display: grid;
  gap: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary-card,
.route-card,
.info-card,
.secret-card,
.callout-card {
  padding: 20px 22px;
  border: 1px solid var(--panel-border);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
}

.route-card {
  gap: 16px;
}

.route-card-head,
.header-actions,
.card-actions,
.dialog-actions,
.field-inline,
.route-metadata {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.route-card-head {
  justify-content: space-between;
  align-items: flex-start;
}

.header-preview code,
.secret-card code {
  display: block;
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  color: #0f172a;
  overflow-wrap: anywhere;
}

.support-note,
.callout-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: #f8fafc;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(6px);
}

.dialog-card {
  position: fixed;
  top: 50%;
  left: 50%;
  width: min(760px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  overflow: auto;
  transform: translate(-50%, -50%);
  padding: 24px;
}

@media (max-width: 920px) {
  .hero-card-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header,
  .route-card-head,
  .dialog-header,
  .header-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .hero-copy {
    min-height: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Run targeted tests, typecheck, and build**

Run:

```bash
npm run test:admin
npm run typecheck
npm run build
```

Expected:

```text
Test Files  5 passed
Tests  6 passed
```

```text
tsc -p tsconfig.json --noEmit
```

```text
vite build --config vite.config.ts
✓ built in ...
```

- [ ] **Step 6: Manually verify the visual result in local dev**

Run:

```bash
npm run dev:local
```

Check:

```text
GET / 200
GET /admin 200
GET /admin/assets/... 200
```

Then manually inspect:

- `/` 初始化页双栏是否仍正常
- `/admin` 未登录时登录页是否正常
- 登录后规则页按钮、卡片、弹窗是否都可用
- 375px、768px、1024px、1440px 下无横向滚动

---

## Self-Review

### Spec Coverage

- 整体视觉系统：由 Task 3 的根变量、字体、卡片、按钮、状态规则覆盖
- 初始化页：由 Task 2 Step 2 覆盖
- 登录页：由 Task 2 Step 3 覆盖
- 规则页：由 Task 2 Step 4 覆盖
- 弹窗：由 Task 2 Step 5 覆盖
- 响应式与 reduced motion：由 Task 3 Step 4 覆盖
- 仅改视觉不改逻辑：由 Guardrails 限制

### Placeholder Scan

- 未使用 `TODO`、`TBD`、`similar to`
- 每个改动步骤都给出了具体代码或命令
- 验证命令和预期输出已写明

### Type Consistency

- 仅使用现有组件名与 props
- 没有新增未定义类型、方法或接口
- 文案和 className 都与 JSX / CSS 中的新增名称对应

## Execution Notes

- 当前仓库还未创建独立 worktree；真正开始执行前，优先考虑先隔离工作区
- 执行时不要提交，等用户本地确认视觉效果后再决定是否提交
