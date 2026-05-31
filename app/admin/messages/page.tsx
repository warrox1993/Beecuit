import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listContactMessages } from "@/lib/queries/contact";
import { MessagesTable } from "@/components/admin/MessagesTable";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");
  const sp = await searchParams;
  const rows = await listContactMessages({ status: sp.status, limit: 100 });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">Messages de contact</h1>
        <nav className="flex gap-3 text-sm">
          {[
            { v: "", label: "Tous" },
            { v: "new", label: "Nouveaux" },
            { v: "read", label: "Lus" },
            { v: "archived", label: "Archivés" },
          ].map((f) => (
            <a key={f.v} href={f.v ? `/admin/messages?status=${f.v}` : "/admin/messages"} className="text-amber-700 underline">
              {f.label}
            </a>
          ))}
        </nav>
      </header>
      <MessagesTable rows={rows} />
    </div>
  );
}
