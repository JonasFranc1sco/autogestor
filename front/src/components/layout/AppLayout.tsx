import { useState } from "react";
import { Outlet } from "react-router-dom";
import { IconMenu } from "@tabler/icons-react";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden print:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <IconMenu size={20} />
          </button>
          <span className="font-semibold">AUTO<span className="text-primary">GESTOR</span></span>
        </header>

        <div className="flex-1 overflow-y-auto print:overflow-visible">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
