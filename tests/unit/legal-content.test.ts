import { describe, expect, it } from "vitest";
import { renderWithPlaceholders } from "@/content/legal/types";

describe("renderWithPlaceholders", () => {
  it("découpe un placeholder au milieu du texte", () => {
    expect(renderWithPlaceholders("Éditeur : [Raison sociale], sis à [Adresse].")).toEqual([
      { text: "Éditeur : ", placeholder: false },
      { text: "[Raison sociale]", placeholder: true },
      { text: ", sis à ", placeholder: false },
      { text: "[Adresse]", placeholder: true },
      { text: ".", placeholder: false },
    ]);
  });

  it("renvoie un seul segment quand il n'y a pas de placeholder", () => {
    expect(renderWithPlaceholders("Texte simple")).toEqual([
      { text: "Texte simple", placeholder: false },
    ]);
  });

  it("gère deux placeholders adjacents", () => {
    expect(renderWithPlaceholders("[A][B]")).toEqual([
      { text: "[A]", placeholder: true },
      { text: "[B]", placeholder: true },
    ]);
  });
});
