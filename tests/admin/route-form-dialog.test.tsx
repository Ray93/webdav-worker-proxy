import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouteFormDialog } from "../../src/admin/features/routes/route-form-dialog";

describe("RouteFormDialog", () => {
  it("does not close when clicking the overlay", () => {
    const onOpenChange = vi.fn();

    const { container } = render(
      <RouteFormDialog
        open
        pending={false}
        title="新增路由"
        submitLabel="保存路由"
        onOpenChange={onOpenChange}
        onSubmit={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const overlay = container.ownerDocument.querySelector(".dialog-overlay");
    expect(overlay).not.toBeNull();

    fireEvent.pointerDown(overlay!);
    fireEvent.click(overlay!);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not close when pressing escape", () => {
    const onOpenChange = vi.fn();

    render(
      <RouteFormDialog
        open
        pending={false}
        title="新增路由"
        submitLabel="保存路由"
        onOpenChange={onOpenChange}
        onSubmit={vi.fn(async () => undefined)}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
