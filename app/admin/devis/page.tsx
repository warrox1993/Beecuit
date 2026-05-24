import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listQuoteRequests } from "@/lib/queries/b2b";
import { DevisTable } from "@/components/admin/DevisTable";

export default async function AdminDevisPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");
  const sp = await searchParams;
  const rows = await listQuoteRequests({ status: sp.status, limit: 100 });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">Devis B2B</h1>
        <nav className="flex gap-3 text-sm">
          {[
            { v: "", label: "Tous" },
            { v: "pending", label: "En attente" },
            { v: "quoted", label: "Envoyés" },
            { v: "paid", label: "Payés" },
            { v: "rejected", label: "Refusés" },
          ].map((f) => (
            <a
              key={f.v}
              href={f.v ? `/admin/devis?status=${f.v}` : "/admin/devis"}
              className={`rounded px-3 py-1 ${
                (sp.status ?? "") === f.v
                  ? "bg-amber-600 text-white"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {f.label}
            </a>
          ))}
        </nav>
      </header>
      <DevisTable rows={rows} />
    </div>
  );
}
