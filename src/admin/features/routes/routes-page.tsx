import { useState } from "react";
import type { ProxyRoute, RouteInput } from "../../lib/api";
import { RouteFormDialog } from "./route-form-dialog";

interface RoutesPageProps {
  routes: ProxyRoute[];
  busy?: boolean;
  error?: string;
  onCreate(value: RouteInput): Promise<void>;
  onEdit(routeId: string, value: RouteInput): Promise<void>;
  onToggle(routeId: string): Promise<void>;
  onDelete(routeId: string): Promise<void>;
  onLogout(): Promise<void>;
}

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; route: ProxyRoute }
  | null;

function toRouteInput(route: ProxyRoute): RouteInput {
  return {
    prefix: route.prefix,
    stripPrefix: route.stripPrefix,
    targetBaseUrl: route.targetBaseUrl,
    customHeaders: route.customHeaders,
    enabled: route.enabled,
  };
}

export function RoutesPage(props: RoutesPageProps) {
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [dialogPending, setDialogPending] = useState(false);
  const [dialogError, setDialogError] = useState<string>();

  return (
    <main className="page-shell">
      <section className="hero-card dashboard-shell">
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

        {props.error ? <p className="form-error page-error">{props.error}</p> : null}

        <div className="route-list">
          {props.routes.length === 0 ? (
            <article className="route-card route-card-empty">
              <span className="empty-pill">从这里开始</span>
              <h2>先添加第一条转发规则</h2>
              <p>从一个访问前缀开始，把请求转发到正确的目标地址。</p>
            </article>
          ) : null}

          {props.routes.map((route) => (
            <article className="route-card" key={route.id}>
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

              {route.customHeaders.length > 0 ? (
                <div className="header-preview">
                  <span className="route-label">附加请求头</span>
                  {route.customHeaders.map((header) => (
                    <code key={`${route.id}-${header.name}`}>
                      {header.name}: {header.value}
                    </code>
                  ))}
                </div>
              ) : null}

              <div className="card-actions">
                <button
                  className="ghost-button"
                  onClick={() => {
                    setDialogError(undefined);
                    setDialogState({ mode: "edit", route });
                  }}
                  type="button"
                >
                  编辑
                </button>
                <button
                  className="ghost-button"
                  disabled={props.busy}
                  onClick={() => void props.onToggle(route.id)}
                  type="button"
                >
                  {route.enabled ? "停用" : "启用"}
                </button>
                <button
                  className="ghost-button ghost-button-danger"
                  disabled={props.busy}
                  onClick={() => void props.onDelete(route.id)}
                  type="button"
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <RouteFormDialog
        error={dialogError}
        initialValue={dialogState?.mode === "edit" ? toRouteInput(dialogState.route) : undefined}
        open={dialogState !== null}
        pending={dialogPending}
        submitLabel={dialogState?.mode === "edit" ? "保存修改" : "保存路由"}
        title={dialogState?.mode === "edit" ? "编辑路由" : "新增路由"}
        onOpenChange={(open) => {
          if (!open) {
            setDialogError(undefined);
            setDialogState(null);
          }
        }}
        onSubmit={async (value) => {
          setDialogPending(true);
          setDialogError(undefined);

          try {
            if (dialogState?.mode === "edit") {
              await props.onEdit(dialogState.route.id, value);
            } else {
              await props.onCreate(value);
            }

            setDialogState(null);
          } catch (error) {
            setDialogError(error instanceof Error ? error.message : "保存失败");
          } finally {
            setDialogPending(false);
          }
        }}
      />
    </main>
  );
}
