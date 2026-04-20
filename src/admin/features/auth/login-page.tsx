import { useState } from "react";

interface LoginPageProps {
  pending: boolean;
  error?: string;
  onSubmit(password: string): Promise<void>;
}

export function LoginPage(props: LoginPageProps) {
  const [password, setPassword] = useState("");

  return (
    <main className="page-shell">
      <section className="hero-card hero-card-grid">
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

        <form
          className="hero-panel stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void props.onSubmit(password);
          }}
        >
          <div className="panel-header">
            <span className="section-tag">登录</span>
            <h2>输入管理密码</h2>
            <p>只需要输入你设置过的密码，登录状态会保留在当前浏览器里。</p>
          </div>

          <label className="field">
            <span>管理员密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入管理密码"
            />
          </label>

          <div className="support-note">
            <strong>如果页面回到初始化流程。</strong>
            <p>通常表示运行时 Secret 被删除或尚未配置，需要重新完成初始化设置。</p>
          </div>

          {props.error ? <p className="form-error">{props.error}</p> : null}

          <button
            className="primary-button"
            disabled={props.pending || password.trim().length === 0}
            type="submit"
          >
            {props.pending ? "登录中..." : "登录"}
          </button>
        </form>
      </section>
    </main>
  );
}
