import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getContactMessage } from "@/lib/queries/contact";
import { MessageStatusActions } from "@/components/admin/MessageStatusActions";

const REASON_LABELS: Record<string, string> = { order: "Commande", b2b: "Professionnels", press: "Presse", delivery: "Livraison", other: "Autre" };

export default async function AdminMessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");
  const { id } = await params;
  const msg = await getContactMessage(id);
  if (!msg) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/messages" className="text-amber-700 underline">&larr; Retour</Link>
      <div className="rounded-lg border border-amber-200 bg-white p-6">
        <div className="flex flex-wrap justify-between gap-2 text-sm text-amber-900">
          <span className="font-semibold">{msg.name}</span>
          <span>{msg.createdAt.toLocaleString("fr-BE")}</span>
        </div>
        <p className="mt-1 text-sm text-amber-800">{msg.email} &middot; {REASON_LABELS[msg.reason] ?? msg.reason}</p>
        {/* Contenu utilisateur rendu via React (échappé), retours ligne préservés, AUCUN HTML brut */}
        <p className="text-warm-brown/90 mt-4 text-sm whitespace-pre-wrap">{msg.message}</p>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-amber-900">Statut</p>
        <MessageStatusActions id={msg.id} current={msg.status} />
      </div>
    </div>
  );
}
