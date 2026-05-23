import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";

const ENV_BADGE = process.env.NODE_ENV === "production" ? "PROD" : "DEV";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/fr/sign-in?callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/fr");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/fr" });
  }

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
