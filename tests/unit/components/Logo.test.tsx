// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Logo } from "@/components/brand/Logo";

describe("Logo", () => {
  // Use case-sensitive regexes (no /i) to distinguish the rendered caps wordmark
  // ("AU FIL DES") from the SVG <title> ("Au Fil des Saveurs") which is present
  // in every variant for accessibility.

  it("renders 'full' variant by default with all 3 text blocks", () => {
    const { container, getByText } = render(<Logo />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(getByText(/AU FIL DES/)).toBeDefined();
    expect(getByText(/^Saveurs$/)).toBeDefined();
    expect(getByText(/BISCUITERIE/)).toBeDefined();
  });

  it("renders 'wordmark' variant without baseline", () => {
    const { queryByText, getByText } = render(<Logo variant="wordmark" />);
    expect(getByText(/AU FIL DES/)).toBeDefined();
    expect(getByText(/^Saveurs$/)).toBeDefined();
    expect(queryByText(/BISCUITERIE/)).toBeNull();
  });

  it("renders 'mark' variant with only the chef toque icon", () => {
    const { container, queryByText } = render(<Logo variant="mark" />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(queryByText(/AU FIL DES/)).toBeNull();
    expect(queryByText(/^Saveurs$/)).toBeNull();
  });

  it("accepts a className prop", () => {
    const { container } = render(<Logo className="h-12 text-honey-dark" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("h-12");
  });

  it("has accessible attributes (role + aria-label)", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toContain("Au Fil des Saveurs");
  });
});
