export type StrengthScore = 0 | 1 | 2 | 3 | 4;
export type StrengthResult = { score: StrengthScore; labelKey: string; suggestionKeys: string[] };

const FORBIDDEN = [
  "password",
  "motdepasse",
  "azerty",
  "qwerty",
  "123456",
  "aufildessaveurs",
  "biscuit",
  "speculoos",
];

const LABELS = ["strengthVeryWeak", "strengthWeak", "strengthFair", "strengthGood", "strengthStrong"];

export function scorePassword(password: string, opts?: { email?: string }): StrengthResult {
  const pw = password ?? "";
  const lower = pw.toLowerCase();
  const suggestionKeys: string[] = [];

  const localPart = opts?.email?.split("@")[0]?.toLowerCase();
  const hasForbidden =
    FORBIDDEN.some((w) => lower.includes(w)) ||
    (!!localPart && localPart.length >= 3 && lower.includes(localPart));

  if (pw.length === 0) {
    return { score: 0, labelKey: LABELS[0]!, suggestionKeys: ["suggestLength"] };
  }

  let points = 0;
  if (pw.length >= 8) points++;
  else suggestionKeys.push("suggestLength");
  if (pw.length >= 12) points++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++;
  else suggestionKeys.push("suggestCase");
  if (/\d/.test(pw)) points++;
  else suggestionKeys.push("suggestDigit");
  if (/[^a-zA-Z0-9]/.test(pw)) points++;
  else suggestionKeys.push("suggestSymbol");

  // Map 0..5 raw points down to 0..4, then hard-cap on forbidden content.
  let score = Math.min(4, points) as StrengthScore;
  if (hasForbidden) {
    score = Math.min(score, 1) as StrengthScore;
    suggestionKeys.unshift("suggestNoCommon");
  }
  if (pw.length < 8) score = Math.min(score, 1) as StrengthScore;

  return { score, labelKey: LABELS[score]!, suggestionKeys: suggestionKeys.slice(0, 2) };
}
