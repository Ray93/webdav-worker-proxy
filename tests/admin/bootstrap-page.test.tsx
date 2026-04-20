import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BootstrapPage } from "../../src/admin/features/bootstrap/bootstrap-page";

describe("BootstrapPage", () => {
  it("shows the generated secret name and action copy", () => {
    render(
      <BootstrapPage
        state="secret_pending"
        secretName="ADMIN_SESSION_SECRET"
        generatedSecret="abc123"
        onSubmit={vi.fn(async () => undefined)}
        onRefresh={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByText("ADMIN_SESSION_SECRET")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "我已完成" })).toBeInTheDocument();
  });
});
