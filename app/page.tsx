import { Button } from "@/components/ui/button";

export default function RootPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center space-y-4">
        <h1 className="text-5xl text-honey">BeeCuit</h1>
        <p className="text-warm-brown">shadcn/ui OK</p>
        <Button className="bg-honey text-cream hover:bg-honey-dark">
          Bouton shadcn
        </Button>
      </div>
    </main>
  );
}
