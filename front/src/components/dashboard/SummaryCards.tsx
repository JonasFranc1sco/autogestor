import {
    IconClipboardList,
    IconCar,
    IconUsers,
    IconPackage,
} from "@tabler/icons-react";

import { Card } from "@/components/ui/card";

const summary = [
    {
        title: "Ordens de serviço",
        value: "12",
        description: "Em aberto",
        icon: IconClipboardList,
    },
    {
        title: "Veículos",
        value: "12",
        description: "Em atendimento",
        icon: IconCar,
    },
    {
        title: "Clientes",
        value: "12",
        description: "Cadastrados",
        icon: IconUsers,
    },
    {
        title: "Produtos",
        value: "128",
        description: "Em estoque",
        icon: IconPackage,
    },
];

export function SummaryCards() {
    return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summary.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title} className="p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-lg border p-3">
                <Icon size={28} stroke={1.8} />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  {item.title}
                </p>

                <p className="text-2xl font-bold">
                  {item.value}
                </p>

                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </section>
    );
}