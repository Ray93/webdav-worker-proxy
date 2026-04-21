import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BootstrapPage } from "../../src/admin/features/bootstrap/bootstrap-page";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

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

  it("copies the secret name and briefly shows copied state", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <BootstrapPage
        state="confirm_secret"
        secretName="ADMIN_SESSION_SECRET"
        generatedSecret="abc123"
        onSubmit={vi.fn(async () => undefined)}
        onRefresh={vi.fn(async () => undefined)}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "复制" })[0]);
    });

    expect(writeText).toHaveBeenCalledWith("ADMIN_SESSION_SECRET");
    expect(screen.getByRole("button", { name: "已复制" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getAllByRole("button", { name: "复制" })).toHaveLength(2);
  });

  it("copies the generated secret value", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <BootstrapPage
        state="confirm_secret"
        secretName="ADMIN_SESSION_SECRET"
        generatedSecret="abc123"
        onSubmit={vi.fn(async () => undefined)}
        onRefresh={vi.fn(async () => undefined)}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "复制" })[1]);
    });

    expect(writeText).toHaveBeenCalledWith("abc123");
    expect(screen.getByRole("button", { name: "已复制" })).toBeInTheDocument();
  });
});
