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
        <div className="hero-copy">
          <span className="eyebrow-pill">管理员登录</span>
          <h1>用密码进入代理管理台</h1>
          <p className="hero-text">
            登录后可以维护前缀路由、控制是否去除前缀，并为上游请求附加自定义头。
          </p>
          <div className="info-stack">
            <div className="info-card">
              <span className="info-label">转发规则</span>
              <p>支持多对多路由，按最长前缀命中。</p>
            </div>
            <div className="info-card">
              <span className="info-label">WebDAV 兼容</span>
              <p>保留流式转发，并处理 Destination / Location 头。</p>
            </div>
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
            <h2>输入管理员密码</h2>
            <p>只需要密码，不需要用户名。登录状态会保存在安全 Cookie 中。</p>
          </div>

          <label className="field">
            <span>管理员密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入之前创建的管理员密码"
            />
          </label>

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
