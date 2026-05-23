import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AddressList } from "@/components/account/AddressList";
import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });
  const rows = await db.select().from(addresses).where(eq(addresses.userId, session!.user!.id!));
  return (
    <section>
      <Eyebrow>MON COMPTE</Eyebrow>
      <Heading as="h1" size="h1" className="mt-3 mb-8">Mes adresses</Heading>
      <AddressList addresses={rows} />
    </section>
  );
}
