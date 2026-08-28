import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getEmployees, createEmployee, type Employee } from "@/services/employee.service";
import { IconLoader2 } from "@tabler/icons-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document_cpf: "",
    document_rg: "",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.document_cpf?.includes(term) ||
        e.document_rg?.includes(term)
    );
  }, [employees, search]);

  async function handleCreate() {
    if (!form.name || !form.email || !form.document_cpf) return;

    try {
      setCreating(true);
      await createEmployee({
        ...form,
        address: 1,
      });
      setDialogOpen(false);
      setForm({ name: "", email: "", phone: "", document_cpf: "", document_rg: "" });
      await loadEmployees();
    } catch (error) {
      console.error("Erro ao criar funcionário:", error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PageLayout
        title="Funcionários"
        searchPlaceholder="Buscar por nome, email, CPF ou RG..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={() => setDialogOpen(true)}
        addLabel="Novo Funcionário"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>RG</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Nenhum funcionário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.document_cpf || "—"}</TableCell>
                    <TableCell>{employee.document_rg || "—"}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone || "—"}</TableCell>
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
        title="Novo Funcionário"
        onSubmit={handleCreate}
        submitLabel="Criar Funcionário"
        loading={creating}
      >
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">CPF *</label>
              <Input
                value={form.document_cpf}
                onChange={(e) => setForm({ ...form, document_cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">RG</label>
              <Input
                value={form.document_rg}
                onChange={(e) => setForm({ ...form, document_rg: e.target.value })}
                placeholder="00.000.000-0"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
