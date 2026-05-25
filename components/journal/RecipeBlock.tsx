import type { ReactNode } from "react";

// Stub: Task 16 will implement the full recipe block (ingredients card, steps,
// schema.org Recipe JSON-LD). For now the detail page can wire the props in
// without compile errors.
type RecipeBlockProps = {
  article: {
    slug: string;
    recipePrepMin: number | null;
    recipeCookMin: number | null;
    recipeDifficulty: "facile" | "moyen" | "avance" | null;
  };
  translation: {
    recipeYieldLabel: string | null;
    recipeIngredients: Array<{ name: string; qty: string; unit: string }> | null;
  };
};

export function RecipeBlock(_props: RecipeBlockProps): ReactNode {
  return null; // Task 16 implements
}

RecipeBlock.Steps = function Steps(_props: {
  steps: Array<{ n: number; text: string }>;
}): ReactNode {
  return null; // Task 16 implements
};
