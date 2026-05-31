import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "@/lib/seo/json-ld";

describe("serializeJsonLd", () => {
  it("produces valid JSON for normal data", () => {
    const obj = { "@type": "Product", name: "Spéculoos", price: "5.00" };
    expect(JSON.parse(serializeJsonLd(obj))).toEqual(obj);
  });

  it("escapes < so a </script> breakout is impossible", () => {
    const malicious = {
      name: "Biscuit</script><script>alert(document.cookie)</script>",
    };
    const out = serializeJsonLd(malicious);
    // The raw closing tag must never appear in the output.
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    // But it must still round-trip to the original value.
    expect(JSON.parse(out)).toEqual(malicious);
  });

  it("escapes >, & as well", () => {
    const out = serializeJsonLd({ v: "a > b && c < d" });
    expect(out).not.toContain(">");
    expect(out).not.toContain("&");
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ v: "a > b && c < d" });
  });
});
