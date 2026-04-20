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
          <div>
            <span className="eyebrow-pill">路由管理</span>
            <h1>管理 WebDAV 转发规则</h1>
            <p className="hero-text">
              支持固定目标基地址、可选去除前缀，并为每条规则维护自定义请求头。
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
            <span className="summary-label">总路由数</span>
            <strong>{props.routes.length}</strong>
          </article>
          <article className="summary-card">
            <span className="summary-label">已启用</span>
            <strong>{props.routes.filter((route) => route.enabled).length}</strong>
          </article>
          <article className="summary-card">
            <span className="summary-label">保留前缀</span>
            <strong>{props.routes.filter((route) => !route.stripPrefix).length}</strong>
          </article>
        </div>

        {props.error ? <p className="form-error page-error">{props.error}</p> : null}

        <div className="route-list">
          {props.routes.length === 0 ? (
            <article className="route-card route-card-empty">
              <h2>还没有代理规则</h2>
              <p>先创建一条路由，把前缀、目标基地址和自定义请求头配置进去。</p>
            </article>
          ) : null}

          {props.routes.map((route) => (
            <article className="route-card" key={route.id}>
              <div className="route-card-head">
                <div>
                  <h2>{route.prefix}</h2>
                  <p>{route.targetBaseUrl}</p>
                </div>
                <span className={route.enabled ? "status-pill is-enabled" : "status-pill"}>
                  {route.enabled ? "启用中" : "已停用"}
                </span>
              </div>

              <div className="route-metadata">
                <span className="meta-pill">
                  {route.stripPrefix ? "去除前缀" : "保留前缀"}
                </span>
                <span className="meta-pill">
                  {route.customHeaders.length} 个请求头
                </span>
              </div>

              {route.customHeaders.length > 0 ? (
                <div className="header-preview">
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
