import {
    IconUserPlus,
    IconClipboardPlus,
    IconCar,
    IconPackage,
} from "@tabler/icons-react";

import { Button } from  "@/components/ui/button";
import { Card } from "@/components/ui/card";

const actions = [
    {
        title: "Novo cliente",
        description: "Cadastrar cliente",
        icon: IconUserPlus,
    },
    {
        title: "Nova OS",
        description: "Criar ordem de serviço",
        icon: IconClipboardPlus,
    },
    {
        title: "Novo veículo",
        description: "Cadastrar veículo",
        icon: IconCar,
    },
    {
        title: "Novo produto",
        description: "Cadastrar produto",
        icon: IconPackage,
    },
];

export function QuickActions() {
    return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">
        Ações rápidas
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Card
              key={action.title}
              className="p-6 transition-colors hover:bg-muted/40"
            >
              <Button
                variant="ghost"
                className="h-auto w-full flex-col gap-4 p-0"
              >
                <Icon size={40} stroke={1.7} />

                <div className="space-y-1 text-center">
                  <p className="font-semibold">
                    {action.title}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
    );
}