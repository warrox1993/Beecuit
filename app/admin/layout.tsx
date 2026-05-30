import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth.actions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";

const ENV_BADGE = process.env.NODE_ENV === "production" ? "PROD" : "DEV";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${routing.defaultLocale}/sign-in?callbackUrl=/admin`);
  }
  if (session.user.role !== "admin") {
    redirect(`/${session.user.preferredLocale ?? routing.defaultLocale}`);
  }

  const userLocale = session.user.preferredLocale ?? routing.defaultLocale;
  const handleSignOut = signOutAction.bind(null, userLocale);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <header className="border-warm-brown/10 flex items-center justify-between border-b bg-white px-6 py-3">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold ${ENV_BADGE === "PROD" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
          >
            {ENV_BADGE}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-warm-brown/70 text-sm">{session.user.email}</span>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
