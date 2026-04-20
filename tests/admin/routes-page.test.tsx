import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoutesPage } from "../../src/admin/features/routes/routes-page";

describe("RoutesPage", () => {
  it("renders route rows and exposes create action", () => {
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

    expect(
      screen.getByRole("heading", { name: "统一管理转发规则" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "规则会按访问路径自动匹配到对应目标地址。你可以在这里统一维护前缀、路径处理方式和附加请求头。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("/dav")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑" })).toBeInTheDocument();
  });

  it("renders the empty state guidance when no routes exist", () => {
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
    expect(
      screen.getByText(
        "从一个访问前缀开始，把请求转发到正确的目标地址。",
      ),
    ).toBeInTheDocument();
  });
});
