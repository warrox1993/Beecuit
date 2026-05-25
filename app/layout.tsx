import { Fraunces, Inter, Pinyon_Script } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  weight: "variable",
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  variable: "--font-pinyon",
  weight: "400",
  display: "swap",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${pinyonScript.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
