import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function Dashboard() {
  return (
    <main className="space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-muted-foreground">
          Aqui está o resumo geral da sua oficina.
        </p>
      </header>

      <QuickActions />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Resumo
        </h2>

        <SummaryCards />
      </section>
    </main>
  );
}