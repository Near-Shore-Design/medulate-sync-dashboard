import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { TemporaryPasswordNotice } from "@/components/admin/TemporaryPasswordNotice";

describe("TemporaryPasswordNotice", () => {
  it("shows the password once with a working copy button", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<TemporaryPasswordNotice password="Abc123!xyz9" account="jane@acme.test" />);

    expect(screen.getByTestId("temporary-password")).toHaveTextContent("Abc123!xyz9");
    expect(screen.getByText(/for jane@acme.test/)).toBeInTheDocument();
    expect(screen.getByText(/shown only once/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    });
    expect(writeText).toHaveBeenCalledWith("Abc123!xyz9");
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
  });
});
