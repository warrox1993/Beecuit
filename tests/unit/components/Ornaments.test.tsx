// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RopeDivider, CornerScallop, DotFlourish } from "@/components/brand/Ornaments";

describe("Ornaments — brand", () => {
  it("RopeDivider renders an SVG with the given className", () => {
    const { container } = render(<RopeDivider className="text-honey-dark" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class")).toContain("text-honey-dark");
  });

  it("RopeDivider respects variant prop (scallop/straight/wave)", () => {
    const { container: cw } = render(<RopeDivider variant="wave" />);
    const { container: cs } = render(<RopeDivider variant="scallop" />);
    const { container: cst } = render(<RopeDivider variant="straight" />);
    expect(cw.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 200 12");
    expect(cs.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 200 10");
    expect(cst.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 200 8");
  });

  it("RopeDivider with ariaLabel becomes accessible (role=img)", () => {
    const { container } = render(<RopeDivider ariaLabel="Décoration cordage" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Décoration cordage");
  });

  it("CornerScallop renders presentation SVG for each corner", () => {
    for (const corner of ["tl", "tr", "bl", "br"] as const) {
      const { container } = render(<CornerScallop corner={corner} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute("role")).toBe("presentation");
    }
  });

  it("DotFlourish renders presentation SVG", () => {
    const { container } = render(<DotFlourish />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("role")).toBe("presentation");
  });
});
