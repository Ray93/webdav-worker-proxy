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
          <span className="eyebrow-pill">管理入口</span>
          <h1>登录转发管理台</h1>
          <p className="hero-text">
            登录后可统一维护转发规则、目标地址，以及需要附加到请求中的自定义头。
          </p>
          <div className="info-stack">
            <div className="info-card">
              <span className="info-label">规则管理</span>
              <p>支持多条规则并行生效，系统会优先匹配更具体的访问路径。</p>
            </div>
            <div className="info-card">
              <span className="info-label">兼容处理</span>
              <p>常见 WebDAV 相关请求头会按规则自动调整，减少手动处理成本。</p>
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
            <h2>输入管理密码</h2>
            <p>仅需输入你设置的管理密码，登录状态会保留在当前浏览器中。</p>
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
