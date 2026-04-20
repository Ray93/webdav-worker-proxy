import { useState } from "react";

interface BootstrapPageProps {
  state: "uninitialized" | "confirm_secret";
  secretName: string;
  generatedSecret?: string;
  pending?: boolean;
  error?: string;
  onSubmit(password: string): Promise<void>;
  onRefresh(): Promise<void>;
}

export function BootstrapPage(props: BootstrapPageProps) {
  const [password, setPassword] = useState("");

  const secretReady = Boolean(props.generatedSecret);

  return (
    <main className="page-shell">
      <section className="hero-card hero-card-grid">
        <div className="hero-copy">
          <span className="eyebrow-pill">初始化</span>
          <h1>完成管理台初始配置</h1>
          <p className="hero-text">
            先设置管理密码，再按页面提示完成管理密钥配置。配置完成后刷新页面，即可进入登录页面。
          </p>
          <div className="info-stack">
            <div className="info-card">
              <span className="info-label">配置步骤</span>
              <p>设置密码 → 复制密钥 → 控制台或 Wrangler 中完成配置 → 返回刷新</p>
            </div>
            <div className="info-card">
              <span className="info-label">管理密钥</span>
              <p className="secret-name">固定使用 ADMIN_SESSION_SECRET</p>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          {props.state === "uninitialized" ? (
            <form
              className="stack-form"
              onSubmit={(event) => {
                event.preventDefault();
                void props.onSubmit(password);
              }}
            >
              <div className="panel-header">
                <h2>设置管理密码</h2>
                <p>该密码仅用于进入管理台，不会附加到转发请求中。</p>
              </div>

              <label className="field">
                <span>管理员密码</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入一个便于管理的密码"
                />
              </label>

              {props.error ? <p className="form-error">{props.error}</p> : null}

              <button
                className="primary-button"
                disabled={props.pending || password.trim().length === 0}
                type="submit"
              >
                {props.pending ? "创建中..." : "创建密码"}
              </button>
            </form>
          ) : (
            <div className="stack-form">
              <div className="panel-header">
                <h2>完成密钥配置</h2>
                <p>
                  {secretReady
                    ? "请复制下面的管理密钥，并到 Cloudflare 控制台或 Wrangler 中完成配置。"
                    : "当前还没有检测到管理密钥。请使用你保存的值完成配置，然后返回这里刷新页面。"}
                </p>
              </div>

              <div className="secret-card">
                <span className="secret-caption">密钥名称</span>
                <code>{props.secretName}</code>
              </div>

              {secretReady ? (
                <div className="secret-card secret-card-strong">
                  <span className="secret-caption">本次生成的密钥</span>
                  <code className="secret-value">{props.generatedSecret}</code>
                </div>
              ) : (
                <div className="callout-card">
                  <strong>页面不会再次显示上一次生成的密钥。</strong>
                  <p>如果你刚完成设置，请使用已保存的值继续配置；完成后点“我已完成”或直接刷新页面。</p>
                </div>
              )}

              {props.error ? <p className="form-error">{props.error}</p> : null}

              <button
                className="primary-button"
                disabled={props.pending}
                onClick={() => void props.onRefresh()}
                type="button"
              >
                {props.pending ? "检测中..." : "我已完成"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
