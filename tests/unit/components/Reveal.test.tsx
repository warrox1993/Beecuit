// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Reveal } from "@/components/motion/Reveal";

// jsdom doesn't implement IntersectionObserver — framer-motion uses it for
// whileInView. Stub it so the component mounts without errors.
class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
  root = null;
  rootMargin = "";
  thresholds = [];
}
beforeEach(() => {
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    IntersectionObserverStub;
});

describe("Reveal", () => {
  it("renders children inside a div by default", () => {
    const { getByText } = render(<Reveal>Hello</Reveal>);
    expect(getByText("Hello")).toBeDefined();
  });

  it("respects className prop", () => {
    const { container } = render(<Reveal className="my-class">x</Reveal>);
    expect(container.firstChild).toHaveProperty("className");
    expect((container.firstChild as HTMLElement).className).toContain("my-class");
  });

  it("renders the requested element when as=section", () => {
    const { container } = render(<Reveal as="section">x</Reveal>);
    expect(container.querySelector("section")).not.toBeNull();
  });
});
