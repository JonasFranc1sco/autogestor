import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash, IconCar } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { ClientFormDialog } from "@/components/dialogs/client-form-dialog";
import { VehicleFormDialog } from "@/components/dialogs/vehicle-form-dialog";
import {
  getClients,
  deleteClient,
  type Client,
} from "@/services/client.service";
import { extractApiErrorMessage } from "@/lib/errors";

export default function ClientsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [vehicleClient, setVehicleClient] = useState<Client | null>(null);
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      setClients(await getClients(query));
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar os clientes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => void load(search), 300);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [search, load]);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      setEditing(null);
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setDialogOpen(true);
  }

  function openVehicleFor(client: Client) {
    setVehicleClient(client);
    setNewVehicleOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClient(deleteTarget.id);
      toast.success("Cliente removido com sucesso.");
      setDeleteTarget(null);
      await load(search);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o cliente."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageLayout
      title="Clientes"
      searchPlaceholder="Buscar por nome, CPF/CNPJ ou e-mail..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Cliente"
    >
      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando clientes...
          </div>
        ) : clients.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 max-sm:hidden">Documento</th>
                  <th className="px-4 py-3 max-md:hidden">Contato</th>
                  <th className="px-4 py-3 max-lg:hidden">Cidade</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{client.document ?? "Sem documento"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-sm:hidden">{client.document ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-md:hidden">
                      {client.phone ?? "—"}
                      {client.email ? ` · ${client.email}` : ""}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-lg:hidden">
                      {client.address ? `${client.address.city}/${client.address.state}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openVehicleFor(client)}
                          aria-label={`Cadastrar veículo para ${client.name}`}
                          title="Cadastrar veículo"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-status-done/10 hover:text-status-done"
                        >
                          <IconCar size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(client)}
                          aria-label={`Editar ${client.name}`}
                          title="Editar"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(client)}
                          aria-label={`Remover ${client.name}`}
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
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {clients.length} cliente(s) exibido(s)
            </p>
          </>
        )}
      </div>

      <ClientFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        onSaved={() => void load(search)}
      />

      <VehicleFormDialog
        open={newVehicleOpen}
        onClose={() => setNewVehicleOpen(false)}
        defaultValues={
          vehicleClient
            ? { owner_id: vehicleClient.id, owner_label: vehicleClient.name }
            : undefined
        }
        onSaved={() => void load(search)}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remover cliente"
        onSubmit={() => void handleDelete()}
        submitLabel="Remover"
        loading={deleting}
        destructive
        maxWidth="max-w-md"
      >
        <p className="text-sm">
          Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? O registro será
          ocultado e poderá ser restaurado manualmente.
        </p>
      </Dialog>
    </PageLayout>
  );
}
