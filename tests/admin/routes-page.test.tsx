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

    expect(screen.getByText("管理转发规则")).toBeInTheDocument();
    expect(screen.getByText("/dav")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增路由" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑" })).toBeInTheDocument();
  });
});
