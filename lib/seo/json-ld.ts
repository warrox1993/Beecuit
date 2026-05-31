/**
 * Serialize a JSON-LD object for safe embedding inside a
 * `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` does NOT escape `<`, so any string value containing the
 * sequence `</script>` would close the script element early and allow markup
 * injection (stored XSS). We escape `<`, `>` and `&` to their unicode escapes,
 * which keeps the JSON valid while making a `</script>` breakout impossible.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
