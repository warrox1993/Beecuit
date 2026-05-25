// Minimal layout for the print route. The root `app/layout.tsx` already provides
// `<html>` and `<body>`, so we MUST NOT nest a new `<html>` here (Next.js App
// Router only allows a single root layout per app). Instead we inject the
// print stylesheet inline and render children directly.
export default function PrintJournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A4; margin: 1.5cm; }
            html, body { background: #fff; }
            .print-doc { font-family: Georgia, serif; color: #000; line-height: 1.4; }
            .print-doc h1 { font-size: 24pt; margin-bottom: 0.5cm; }
            .print-doc h2 { font-size: 14pt; margin-top: 0.6cm; margin-bottom: 0.2cm; }
            .print-doc ul, .print-doc ol { margin: 0.2cm 0 0.4cm 0.8cm; padding: 0; }
            .print-doc li { margin: 0.15cm 0; }
            .print-doc hr { border: 0; border-top: 1px solid #ccc; margin: 0.5cm 0; }
            .print-doc .meta { font-size: 10pt; color: #444; }
            .print-doc footer { font-size: 8pt; color: #888; margin-top: 1cm; border-top: 1px solid #eee; padding-top: 0.3cm; }
            @media screen {
              .print-doc { max-width: 21cm; margin: 2cm auto; padding: 2cm; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            }
          `,
        }}
      />
      {children}
    </>
  );
}
