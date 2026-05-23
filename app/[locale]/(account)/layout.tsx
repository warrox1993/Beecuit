import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-12">
        <AccountSidebar />
        <main className="flex-1">{children}</main>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
