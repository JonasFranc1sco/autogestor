import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
import {
  getServiceOrders,
  createServiceOrder,
  type ServiceOrder,
} from "@/services/serviceOrder.service";
import { getClients, type Client } from "@/services/client.service";
import { getVehicles, type Vehicle } from "@/services/vehicle.service";
import { IconLoader2 } from "@tabler/icons-react";

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Aberta", className: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "Em andamento", className: "bg-status-progress/10 text-status-progress" },
  WAITING_PARTS: { label: "Aguardando peças", className: "bg-status-waiting/10 text-status-waiting" },
  WAITING_CLIENT: { label: "Aguardando cliente", className: "bg-status-client/10 text-status-client" },
  DONE: { label: "Concluída", className: "bg-status-done/10 text-status-done" },
  CANCELLED: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    client_id: "",
    vehicle_id: "",
    description: "",
    observations: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [oData, cData, vData] = await Promise.all([
        getServiceOrders(),
        getClients(),
        getVehicles(),
      ]);
      setOrders(oData);
      setClients(cData);
      setVehicles(vData);
    } catch (error) {
      console.error("Erro ao carregar ordens de serviço:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.client?.name?.toLowerCase().includes(term) ||
        o.vehicle?.license_plate?.toLowerCase().includes(term) ||
        o.vehicle?.model?.toLowerCase().includes(term) ||
        o.status.toLowerCase().includes(term)
    );
  }, [orders, search]);

  const filteredVehicles = useMemo(() => {
    if (!form.client_id) return [];
    return vehicles.filter((v) => v.owner?.id === form.client_id);
  }, [vehicles, form.client_id]);

  async function handleCreate() {
    if (!form.client_id || !form.vehicle_id) return;

    try {
      setCreating(true);
      await createServiceOrder({
        client_id: form.client_id,
        vehicle_id: form.vehicle_id,
        description: form.description || undefined,
        observations: form.observations || undefined,
      });
      setDialogOpen(false);
      setForm({ client_id: "", vehicle_id: "", description: "", observations: "" });
      await loadData();
    } catch (error) {
      console.error("Erro ao criar ordem de serviço:", error);
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  return (
    <>
      <PageLayout
        title="Ordens de Serviço"
        searchPlaceholder="Buscar por cliente, placa, modelo ou status..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={() => setDialogOpen(true)}
        addLabel="Nova OS"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Nenhuma ordem de serviço encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">{order.client?.name || "—"}</TableCell>
                    <TableCell>
                      {order.vehicle?.license_plate} — {order.vehicle?.brand} {order.vehicle?.model}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusConfig[order.status]?.className || ""}`}
                      >
                        {statusConfig[order.status]?.label || order.status}
                      </span>
                    </TableCell>
                    <TableCell>R$ {order.total_price}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </PageLayout>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Nova Ordem de Serviço"
        onSubmit={handleCreate}
        submitLabel="Criar OS"
        loading={creating}
      >
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Cliente *</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value, vehicle_id: "" })}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.document}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Veículo *</label>
            <select
              value={form.vehicle_id}
              onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              disabled={!form.client_id}
            >
              <option value="">
                {form.client_id ? "Selecione um veículo" : "Selecione um cliente primeiro"}
              </option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} — {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição do serviço</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o serviço solicitado..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Observações</label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              placeholder="Observações internas..."
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
