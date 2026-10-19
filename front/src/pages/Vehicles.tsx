import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { VehicleFormDialog } from "@/components/dialogs/vehicle-form-dialog";
import { ClientFormDialog } from "@/components/dialogs/client-form-dialog";
import { Pagination } from "@/components/ui/pagination";
import {
  getVehiclesPaginated,
  deleteVehicle,
  type Vehicle,
} from "@/services/vehicle.service";
import { type Client } from "@/services/client.service";
import { isInvalidPageError } from "@/services/pagination";
import { extractApiErrorMessage } from "@/lib/errors";

export default function VehiclesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<Client | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async (targetPage: number, query?: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getVehiclesPaginated({ page: targetPage, search: query });
      if (requestId !== requestIdRef.current) return;
      setVehicles(data.results);
      setTotalCount(data.count);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      if (targetPage > 1 && isInvalidPageError(error)) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar os veículos."));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    void load(page, debouncedSearch);
  }, [page, debouncedSearch, load]);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      setEditing(null);
      setNewClient(null);
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setNewClient(null);
    setDialogOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setNewClient(null);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVehicle(deleteTarget.id);
      toast.success("Veículo removido com sucesso.");
      setDeleteTarget(null);
      await load(page, debouncedSearch);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o veículo."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageLayout
      title="Veículos"
      searchPlaceholder="Buscar por placa, marca, modelo ou proprietário..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Veículo"
    >
      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando veículos...
          </div>
        ) : vehicles.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search ? "Nenhum veículo encontrado para esta busca." : "Nenhum veículo cadastrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Placa</th>
                  <th className="px-4 py-3">Veículo</th>
                  <th className="px-4 py-3 max-md:hidden">Proprietário</th>
                  <th className="px-4 py-3 max-lg:hidden">Ano</th>
                  <th className="px-4 py-3 max-lg:hidden">Quilometragem</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{vehicle.license_plate ?? "Sem placa"}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{vehicle.owner.name}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {vehicle.brand} {vehicle.model}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-md:hidden">{vehicle.owner.name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-lg:hidden">{vehicle.year ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-lg:hidden">{vehicle.mileage ? `${vehicle.mileage} km` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(vehicle)}
                          aria-label={`Editar ${vehicle.license_plate ?? "veículo"}`}
                          title="Editar"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(vehicle)}
                          aria-label={`Remover ${vehicle.license_plate ?? "veículo"}`}
                          title="Remover"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={page}
              totalCount={totalCount}
              onPageChange={setPage}
              itemLabel="veículo(s)"
            />
          </>
        )}
      </div>

      <VehicleFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        newClient={newClient}
        onSaved={() => void load(page, debouncedSearch)}
        onCreateClient={() => setClientDialogOpen(true)}
      />

      <ClientFormDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onSaved={(client) => {
          setNewClient(client ?? null);
        }}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remover veículo"
        onSubmit={() => void handleDelete()}
        submitLabel="Remover"
        loading={deleting}
        destructive
        maxWidth="max-w-md"
      >
        <p className="text-sm">
          Tem certeza que deseja remover <strong>{deleteTarget?.license_plate ?? "este veículo"}</strong>?
          O registro será ocultado e poderá ser restaurado manualmente.
        </p>
      </Dialog>
    </PageLayout>
  );
}
