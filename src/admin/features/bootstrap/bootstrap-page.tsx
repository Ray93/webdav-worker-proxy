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
                <span className="section-tag">第一步</span>
                <h2>创建登录密码</h2>
                <p>这个密码只用于进入管理台，不会附加到转发请求里。</p>
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

              <div className="support-note">
                <strong>建议保存好这组密码。</strong>
                <p>后续登录、调整转发规则、管理请求头时都会用到它。</p>
              </div>

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
                <span className="section-tag">第二步</span>
                <h2>继续完成安全密钥设置</h2>
                <p>
                  {secretReady
                    ? "复制下面这组值，到 Cloudflare 控制台或 Wrangler 中完成 Secret 配置。"
                    : "当前还没有检测到运行时 Secret。请使用你保存的值完成配置，然后回来刷新页面。"}
                </p>
              </div>

              <div className="secret-card">
                <span className="secret-caption">密钥名称</span>
                <code>{props.secretName}</code>
              </div>

              {secretReady ? (
                <div className="secret-card secret-card-strong">
                  <span className="secret-caption">本次生成的密钥值</span>
                  <code className="secret-value">{props.generatedSecret}</code>
                </div>
              ) : (
                <div className="callout-card">
                  <strong>页面不会再次展示上一次生成的密钥。</strong>
                  <p>如果你已经完成配置，直接刷新页面也可以；如果 Secret 被删掉，页面会重新回到初始化流程。</p>
                </div>
              )}

              <div className="support-note">
                <strong>完成配置后有两种返回方式。</strong>
                <p>可以点“我已完成”立即检测，也可以直接刷新页面，系统会自动判断是否已经配置成功。</p>
              </div>

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
