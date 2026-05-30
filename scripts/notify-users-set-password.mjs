import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { randomBytes, createHash } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);
const resend = new Resend(process.env.AUTH_RESEND_KEY);

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://beecuit.vercel.app").replace(/\/$/, "");

const users = await sql`
  SELECT id, email, preferred_locale
  FROM users
  WHERE password_hash IS NULL
    AND email_verified IS NOT NULL
`;

console.log(`Found ${users.length} users without password_hash.`);

for (const u of users) {
  const raw = randomBytes(32).toString("base64url");
  const hashed = createHash("sha256").update(raw).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await sql`
    INSERT INTO password_reset_tokens (token, user_id, expires_at)
    VALUES (${hashed}, ${u.id}, ${expires})
  `;
  const locale = ["fr", "nl", "de", "en"].includes(u.preferred_locale) ? u.preferred_locale : "fr";
  const url = `${APP_URL}/${locale}/reset-password/${raw}`;

  await resend.emails.send({
    from: process.env.AUTH_EMAIL_FROM,
    to: u.email,
    subject: "Nouveau login Au Fil des Saveurs — choisis un mot de passe",
    html: `
      <p>Nous avons mis à jour notre système de connexion.</p>
      <p>Pour continuer à accéder à ton compte, choisis un mot de passe en suivant ce lien (valable 1h) :</p>
      <p><a href="${url}">${url}</a></p>
      <p>Tu peux aussi te connecter directement avec Google si ton compte Google utilise la même adresse.</p>
    `,
  });
  console.log(` ✓ Sent reset link to ${u.email}`);
}

console.log("Done.");
