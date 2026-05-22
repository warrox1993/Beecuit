import { Button } from "@/components/ui/button";

export default function RootPage() {
  return (
    <main className="bg-cream flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-honey text-5xl">BeeCuit</h1>
        <p className="text-warm-brown">shadcn/ui OK</p>
        <Button className="bg-honey text-cream hover:bg-honey-dark">Bouton shadcn</Button>
      </div>
    </main>
  );
}
