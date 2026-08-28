import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getVehicles, createVehicle, type Vehicle } from "@/services/vehicle.service";
import { getClients, type Client } from "@/services/client.service";
import { IconLoader2 } from "@tabler/icons-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    owner: "",
    license_plate: "",
    brand: "",
    model: "",
    color: "",
    chassis: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [vData, cData] = await Promise.all([getVehicles(), getClients()]);
      setVehicles(vData);
      setClients(cData);
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.license_plate.toLowerCase().includes(term) ||
        v.brand.toLowerCase().includes(term) ||
        v.model.toLowerCase().includes(term) ||
        v.owner?.name?.toLowerCase().includes(term)
    );
  }, [vehicles, search]);

  async function handleCreate() {
    if (!form.owner || !form.license_plate || !form.brand || !form.model) return;

    try {
      setCreating(true);
      await createVehicle(form);
      setDialogOpen(false);
      setForm({ owner: "", license_plate: "", brand: "", model: "", color: "", chassis: "" });
      await loadData();
    } catch (error) {
      console.error("Erro ao criar veículo:", error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PageLayout
        title="Veículos"
        searchPlaceholder="Buscar por placa, marca, modelo ou proprietário..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={() => setDialogOpen(true)}
        addLabel="Novo Veículo"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Proprietário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Nenhum veículo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium font-mono">{vehicle.license_plate}</TableCell>
                    <TableCell>{vehicle.brand}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.color}</TableCell>
                    <TableCell>{vehicle.owner?.name || "—"}</TableCell>
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
        title="Novo Veículo"
        onSubmit={handleCreate}
        submitLabel="Criar Veículo"
        loading={creating}
      >
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Proprietário *</label>
            <select
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Placa *</label>
              <Input
                value={form.license_plate}
                onChange={(e) => setForm({ ...form, license_plate: e.target.value.toUpperCase() })}
                placeholder="ABC1D23"
                maxLength={7}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Marca *</label>
              <Input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Ex: Honda"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Modelo *</label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Ex: Civic"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cor</label>
              <Input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Ex: Prata"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Chassi</label>
            <Input
              value={form.chassis}
              onChange={(e) => setForm({ ...form, chassis: e.target.value })}
              placeholder="Número do chassi"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
