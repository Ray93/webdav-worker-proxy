import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BootstrapPage } from "../../src/admin/features/bootstrap/bootstrap-page";

describe("BootstrapPage", () => {
  it("shows the generated secret name and action copy", () => {
    render(
      <BootstrapPage
        state="confirm_secret"
        secretName="ADMIN_SESSION_SECRET"
        generatedSecret="abc123"
        onSubmit={vi.fn(async () => undefined)}
        onRefresh={vi.fn(async () => undefined)}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "先完成管理台初始化" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "继续完成安全密钥设置" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("ADMIN_SESSION_SECRET")).toHaveLength(2);
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "我已完成" })).toBeInTheDocument();
  });
});
