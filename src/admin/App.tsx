import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import {
  ApiError,
  createRoute,
  deleteRoute,
  fetchBootstrap,
  listRoutes,
  login,
  logout,
  setupPassword,
  toggleRoute,
  updateRoute,
  type BootstrapResponse,
  type ProxyRoute,
  type RouteInput,
} from "./lib/api";
import { BootstrapPage } from "./features/bootstrap/bootstrap-page";
import { LoginPage } from "./features/auth/login-page";
import { RoutesPage } from "./features/routes/routes-page";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请求失败";
}

function LoadingScreen() {
  return (
    <main className="page-shell">
      <section className="hero-card loading-card">
        <span className="eyebrow-pill">加载中</span>
        <h1>正在同步管理台状态</h1>
        <p className="hero-text">读取初始化状态、会话信息和当前代理路由。</p>
      </section>
    </main>
  );
}

export default function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [generatedSecret, setGeneratedSecret] = useState<string>();
  const [routes, setRoutes] = useState<ProxyRoute[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupPending, setSetupPending] = useState(false);
  const [refreshPending, setRefreshPending] = useState(false);
  const [loginPending, setLoginPending] = useState(false);
  const [routesBusy, setRoutesBusy] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string>();
  const [loginError, setLoginError] = useState<string>();
  const [routesError, setRoutesError] = useState<string>();

  const refreshBootstrapState = useEffectEvent(async () => {
    const next = await fetchBootstrap();
    startTransition(() => {
      setBootstrap(next);
      setBootstrapError(undefined);
    });
    return next;
  });

  const syncSession = useEffectEvent(async (currentBootstrap?: BootstrapResponse) => {
    const state = currentBootstrap ?? bootstrap;
    if (!state || state.state !== "ready") {
      startTransition(() => {
        setAuthenticated(false);
        setRoutes([]);
        setRoutesError(undefined);
      });
      return;
    }

    try {
      const nextRoutes = await listRoutes();
      startTransition(() => {
        setRoutes(nextRoutes);
        setAuthenticated(true);
        setRoutesError(undefined);
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        startTransition(() => {
          setAuthenticated(false);
          setRoutes([]);
          setRoutesError(undefined);
        });
        return;
      }

      startTransition(() => {
        setRoutesError(getErrorMessage(error));
      });
    }
  });

  useEffect(() => {
    void (async () => {
      try {
        const nextBootstrap = await refreshBootstrapState();
        await syncSession(nextBootstrap);
      } catch (error) {
        setBootstrapError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshBootstrapState, syncSession]);

  if (loading || !bootstrap) {
    return <LoadingScreen />;
  }

  if (bootstrap.state !== "ready") {
    return (
      <BootstrapPage
        error={bootstrapError}
        generatedSecret={generatedSecret}
        pending={setupPending || refreshPending}
        secretName={bootstrap.secretName}
        state={bootstrap.state}
        onRefresh={async () => {
          setRefreshPending(true);
          try {
            const nextBootstrap = await refreshBootstrapState();
            await syncSession(nextBootstrap);
            if (nextBootstrap.state === "ready") {
              setGeneratedSecret(undefined);
            }
          } catch (error) {
            setBootstrapError(getErrorMessage(error));
          } finally {
            setRefreshPending(false);
          }
        }}
        onSubmit={async (password) => {
          setSetupPending(true);
          setBootstrapError(undefined);

          try {
            const result = await setupPassword(password);
            setGeneratedSecret(result.generatedSecret);
            startTransition(() => {
              setBootstrap({
                state: "secret_pending",
                hasRuntimeSecret: false,
                secretName: result.secretName,
              });
            });
          } catch (error) {
            setBootstrapError(getErrorMessage(error));
          } finally {
            setSetupPending(false);
          }
        }}
      />
    );
  }

  if (!authenticated) {
    return (
      <LoginPage
        error={loginError}
        pending={loginPending}
        onSubmit={async (password) => {
          setLoginPending(true);
          setLoginError(undefined);

          try {
            await login(password);
            await syncSession({
              ...bootstrap,
              state: "ready",
            });
          } catch (error) {
            setLoginError(getErrorMessage(error));
          } finally {
            setLoginPending(false);
          }
        }}
      />
    );
  }

  return (
    <RoutesPage
      busy={routesBusy}
      error={routesError}
      routes={routes}
      onCreate={async (value: RouteInput) => {
        setRoutesBusy(true);
        try {
          await createRoute(value);
          await syncSession();
        } finally {
          setRoutesBusy(false);
        }
      }}
      onDelete={async (routeId: string) => {
        setRoutesBusy(true);
        try {
          await deleteRoute(routeId);
          await syncSession();
        } finally {
          setRoutesBusy(false);
        }
      }}
      onEdit={async (routeId: string, value: RouteInput) => {
        setRoutesBusy(true);
        try {
          await updateRoute(routeId, value);
          await syncSession();
        } finally {
          setRoutesBusy(false);
        }
      }}
      onLogout={async () => {
        setRoutesBusy(true);
        try {
          await logout();
          startTransition(() => {
            setAuthenticated(false);
            setRoutes([]);
            setLoginError(undefined);
          });
        } finally {
          setRoutesBusy(false);
        }
      }}
      onToggle={async (routeId: string) => {
        setRoutesBusy(true);
        try {
          await toggleRoute(routeId);
          await syncSession();
        } finally {
          setRoutesBusy(false);
        }
      }}
    />
  );
}
