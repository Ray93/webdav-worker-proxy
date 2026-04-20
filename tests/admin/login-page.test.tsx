import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../../src/admin/features/auth/login-page";

describe("LoginPage", () => {
  it("renders a password-only form", () => {
    render(<LoginPage pending={false} onSubmit={vi.fn(async () => undefined)} />);

    expect(screen.getByText("登录转发管理台")).toBeInTheDocument();
    expect(screen.getByLabelText("管理员密码")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
  });
});
