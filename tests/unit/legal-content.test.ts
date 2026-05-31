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

import { getLegalDocument } from "@/content/legal";

describe("getLegalDocument", () => {
  it("renvoie le document mentions-legales en FR", () => {
    const d = getLegalDocument("mentions-legales", "fr");
    expect(d.title).toBe("Mentions légales");
    expect(d.sections.length).toBeGreaterThan(0);
  });
  it("retombe sur le FR pour une locale inconnue", () => {
    const d = getLegalDocument("mentions-legales", "xx");
    expect(d.title).toBe("Mentions légales");
  });
  it("a une version par locale supportée", () => {
    for (const l of ["fr", "nl", "de", "en"]) {
      expect(getLegalDocument("mentions-legales", l).sections.length).toBeGreaterThan(0);
    }
  });
  it("renvoie les CGV avec les 12 sections en FR", () => {
    const d = getLegalDocument("cgv", "fr");
    expect(d.title).toBe("Conditions générales de vente");
    expect(d.sections).toHaveLength(12);
  });
  it("mentionne IP de session et 2FA dans la politique de confidentialité FR", () => {
    const d = getLegalDocument("confidentialite", "fr");
    const allText = JSON.stringify(d).toLowerCase();
    expect(allText).toContain("adresse ip");
    expect(allText).toContain("2fa");
  });
  it("fournit les 4 pages dans les 4 locales", () => {
    const keys = ["cgv", "mentions-legales", "confidentialite", "cookies"] as const;
    for (const k of keys) {
      for (const l of ["fr", "nl", "de", "en"]) {
        const d = getLegalDocument(k, l);
        expect(d.title.length).toBeGreaterThan(0);
        expect(d.sections.length).toBeGreaterThan(0);
      }
    }
  });
});
