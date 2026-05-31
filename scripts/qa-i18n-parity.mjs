// QA: vérifie la parité des clés i18n entre les 4 locales.
// Usage: node scripts/qa-i18n-parity.mjs
import { readFileSync } from "node:fs";

const LOCALES = ["fr", "nl", "de", "en"];
const REF = "fr";

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

const data = {};
for (const loc of LOCALES) {
  data[loc] = flatten(JSON.parse(readFileSync(`messages/${loc}.json`, "utf8")));
}

const refKeys = new Set(Object.keys(data[REF]));
let problems = 0;

for (const loc of LOCALES) {
  if (loc === REF) continue;
  const keys = new Set(Object.keys(data[loc]));
  const missing = [...refKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !refKeys.has(k));
  if (missing.length) {
    problems += missing.length;
    console.log(`\n❌ [${loc}] MANQUE ${missing.length} clé(s) présentes dans ${REF}:`);
    missing.forEach((k) => console.log(`   - ${k}`));
  }
  if (extra.length) {
    console.log(`\n⚠️  [${loc}] ${extra.length} clé(s) EN TROP (absentes de ${REF}):`);
    extra.forEach((k) => console.log(`   + ${k}`));
  }
}

// Valeurs vides
for (const loc of LOCALES) {
  const empties = Object.entries(data[loc])
    .filter(([, v]) => v === "" || v == null)
    .map(([k]) => k);
  if (empties.length) {
    console.log(`\n⚠️  [${loc}] ${empties.length} valeur(s) vide(s):`);
    empties.forEach((k) => console.log(`   ∅ ${k}`));
  }
}

console.log(
  `\n${problems === 0 ? "✅" : "❌"} Parité i18n : ${refKeys.size} clés de référence (${REF}), ${problems} clé(s) manquante(s) au total.`,
);
process.exit(problems > 0 ? 1 : 0);
