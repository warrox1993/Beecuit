import * as React from "react";
import { renderWithPlaceholders } from "@/content/legal/types";

/** Rend un texte en mettant en évidence les [placeholders] à compléter. */
export function PlaceholderText({ text }: { text: string }) {
  return (
    <>
      {renderWithPlaceholders(text).map((seg, i) =>
        seg.placeholder ? (
          <mark
            key={i}
            className="bg-honey-cream text-honey-dark rounded px-1 font-medium"
            title="À compléter"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ),
      )}
    </>
  );
}
