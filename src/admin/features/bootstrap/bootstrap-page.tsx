import { useState } from "react";

interface BootstrapPageProps {
  state: "uninitialized" | "secret_pending";
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
          <h1>配置你的 WebDAV 中转控制台</h1>
          <p className="hero-text">
            先创建管理员密码，再把系统生成的 Worker Secret 配置到
            Cloudflare。Secret 生效后，刷新页面即可进入密码登录。
          </p>
          <div className="info-stack">
            <div className="info-card">
              <span className="info-label">流程</span>
              <p>创建密码 → 复制密钥 → Wrangler / 控制台配置 → 返回刷新</p>
            </div>
            <div className="info-card">
              <span className="info-label">Secret 名称</span>
              <p className="secret-name">固定使用 Worker 会话密钥</p>
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
                <h2>创建管理员密码</h2>
                <p>该密码用于进入管理台，不会作为上游 WebDAV 凭据转发。</p>
              </div>

              <label className="field">
                <span>管理员密码</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少输入一个你记得住的强密码"
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
                <h2>配置运行时 Secret</h2>
                <p>
                  {secretReady
                    ? "复制下面的密钥，到 Wrangler 或 Cloudflare 控制台中配置。"
                    : "当前没有检测到运行时 Secret。请使用你已保存的密钥重新配置，然后返回刷新。"}
                </p>
              </div>

              <div className="secret-card">
                <span className="secret-caption">Secret 名称</span>
                <code>{props.secretName}</code>
              </div>

              {secretReady ? (
                <div className="secret-card secret-card-strong">
                  <span className="secret-caption">生成的密钥</span>
                  <code className="secret-value">{props.generatedSecret}</code>
                </div>
              ) : (
                <div className="callout-card">
                  <strong>密钥未随页面恢复显示。</strong>
                  <p>如果你刚创建过密码，请使用刚才复制的值完成配置；配置完成后点“我已完成”或直接刷新页面。</p>
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
