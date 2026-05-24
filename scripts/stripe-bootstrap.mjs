#!/usr/bin/env node
import Stripe from "stripe";

const apiKey = process.env.STRIPE_API_KEY;
if (!apiKey) {
  console.error("ERROR: set STRIPE_API_KEY env var before running.");
  console.error("  PowerShell: $env:STRIPE_API_KEY = \"rk_test_...\"; node scripts/stripe-bootstrap.mjs");
  process.exit(1);
}

const stripe = new Stripe(apiKey);
const WEBHOOK_URL = "https://beecuit.vercel.app/api/webhooks/stripe";

const results = {};

async function createTaxRate() {
  console.log("\n[1/3] Creating Tax Rate BE 6% (inclusive)...");
  const existing = await stripe.taxRates.list({ active: true, limit: 100 });
  const dup = existing.data.find(
    (t) =>
      t.country === "BE" &&
      Number(t.percentage) === 6 &&
      t.inclusive === true &&
      t.display_name === "TVA BE Alimentation",
  );
  if (dup) {
    console.log(`  ↳ already exists: ${dup.id} — reusing`);
    results.tax_rate_id = dup.id;
    return;
  }
  const tr = await stripe.taxRates.create({
    display_name: "TVA BE Alimentation",
    description: "TVA Belgique - Produits alimentaires (6%)",
    jurisdiction: "BE",
    country: "BE",
    percentage: 6,
    inclusive: true,
    tax_type: "vat",
  });
  console.log(`  ↳ created: ${tr.id}`);
  results.tax_rate_id = tr.id;
}

async function createWebhookEndpoint() {
  console.log("\n[2/3] Creating webhook endpoint...");
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const dup = existing.data.find((w) => w.url === WEBHOOK_URL);
  if (dup) {
    console.log(`  ↳ already exists: ${dup.id}`);
    console.log("  ↳ NOTE: signing secret only returned on creation.");
    console.log("    If you don't have whsec_ saved, delete this endpoint in Dashboard and re-run.");
    results.webhook_id = dup.id;
    results.webhook_secret = "<existing — re-create if missing>";
    return;
  }
  const wh = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    description: "BeeCuit prod webhook",
    enabled_events: ["checkout.session.completed"],
  });
  console.log(`  ↳ created: ${wh.id}`);
  results.webhook_id = wh.id;
  results.webhook_secret = wh.secret;
}

async function listPaymentMethods() {
  console.log("\n[3/3] Listing payment method configurations...");
  try {
    const cfgs = await stripe.paymentMethodConfigurations.list({ limit: 10 });
    if (cfgs.data.length === 0) {
      console.log("  ↳ no payment_method_configurations found (legacy account-level config in use)");
      results.bancontact = "UNKNOWN — check Dashboard → Settings → Payment methods";
      return;
    }
    for (const cfg of cfgs.data) {
      const isDefault = cfg.is_default ? " [DEFAULT]" : "";
      console.log(`\n  Config: ${cfg.name || cfg.id}${isDefault}`);
      const methods = Object.entries(cfg)
        .filter(([, v]) => v && typeof v === "object" && "display_preference" in v)
        .map(([k, v]) => ({
          name: k,
          state: v.display_preference?.value || "unknown",
        }));
      for (const m of methods) {
        const flag = m.name === "bancontact" ? " ←" : "";
        console.log(`    - ${m.name.padEnd(28)} ${m.state}${flag}`);
      }
      if (cfg.is_default || cfgs.data.length === 1) {
        const bc = methods.find((m) => m.name === "bancontact");
        results.bancontact = bc ? bc.state : "not present";
      }
    }
  } catch (e) {
    console.log(`  ↳ couldn't list configurations: ${e.message}`);
    results.bancontact = "ERROR — check Dashboard manually";
  }
}

(async () => {
  try {
    await createTaxRate();
    await createWebhookEndpoint();
    await listPaymentMethods();

    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY — paste these into .env.local:");
    console.log("=".repeat(60));
    console.log(`STRIPE_TAX_RATE_ID=${results.tax_rate_id}`);
    console.log(`STRIPE_WEBHOOK_SECRET=${results.webhook_secret}`);
    console.log(`\nWebhook endpoint ID: ${results.webhook_id}`);
    console.log(`Bancontact state:    ${results.bancontact}`);
    console.log("=".repeat(60));
  } catch (e) {
    console.error("\nFAILED:", e.message);
    if (e.type) console.error("  type:", e.type);
    if (e.code) console.error("  code:", e.code);
    process.exit(1);
  }
})();
