import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AddressList } from "@/components/account/AddressList";
import { setRequestLocale } from "next-intl/server";

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });
  const rows = await db.select().from(addresses).where(eq(addresses.userId, session!.user!.id!));
  return (
    <section>
      <h1 className="text-honey font-display mb-6 text-3xl">Mes adresses</h1>
      <AddressList addresses={rows} />
    </section>
  );
}
