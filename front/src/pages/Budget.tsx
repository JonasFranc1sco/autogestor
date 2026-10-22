import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconPrinter,
  IconPlus,
  IconTrash,
  IconPencil,
  IconFileDollar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea } from "@/components/ui/form";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { useAuth } from "@/contexts/AuthContext";
import { getClients, type Client } from "@/services/client.service";
import { getVehicles, type Vehicle } from "@/services/vehicle.service";
import { getServices, type Service } from "@/services/service.service";
import { getProducts, type Product } from "@/services/product.service";
import { getWorkshop, type Workshop } from "@/services/workshop.service";
import { formatCurrency, formatDateTime, parseDecimalValue } from "@/lib/format";
import { maskCep, maskCpfCnpj, maskPhone, toLocalPhoneDigits } from "@/lib/masks";

interface PrintableAddress {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string | null;
}

function formatFullAddress(address?: PrintableAddress | null): string | null {
  if (!address) return null;
  const streetPart = [
    address.street,
    address.number ? `nº ${address.number}` : null,
    address.complement || null,
  ]
    .filter(Boolean)
    .join(", ");
  const cityPart = [
    address.neighborhood,
    address.city && address.state
      ? `${address.city}/${address.state}`
      : address.city || address.state,
    address.cep ? `CEP ${maskCep(address.cep)}` : null,
  ]
    .filter(Boolean)
    .join(" — ");
  return [streetPart, cityPart].filter(Boolean).join(" · ") || null;
}

function formatFormattedPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = toLocalPhoneDigits(phone);
  return digits ? maskPhone(digits) : phone;
}

interface BudgetServiceRow {
  key: number;
  service_id: string;
  catalog_label: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface BudgetProductRow {
  key: number;
  product_id: string;
  catalog_label: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

let rowKey = 0;

function createEmptyServiceRow(): BudgetServiceRow {
  return {
    key: ++rowKey,
    service_id: "",
    catalog_label: "",
    description: "",
    quantity: "1",
    unitPrice: "",
  };
}

function createEmptyProductRow(): BudgetProductRow {
  return {
    key: ++rowKey,
    product_id: "",
    catalog_label: "",
    description: "",
    quantity: "1",
    unitPrice: "",
  };
}

export default function BudgetPage() {
  const { user } = useAuth();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [notes, setNotes] = useState("");
  const [serviceRows, setServiceRows] = useState<BudgetServiceRow[]>(() => [
    createEmptyServiceRow(),
  ]);
  const [productRows, setProductRows] = useState<BudgetProductRow[]>(() => [
    createEmptyProductRow(),
  ]);
  const [issuedAt, setIssuedAt] = useState<string>(() => new Date().toISOString());
  const [postPrintModalOpen, setPostPrintModalOpen] = useState(false);

  const clientCache = useRef(new Map<string, Client>());
  const vehicleCache = useRef(new Map<string, Vehicle>());
  const serviceCache = useRef(new Map<string, Service>());
  const productCache = useRef(new Map<string, Product>());

  useEffect(() => {
    getWorkshop()
      .then(setWorkshop)
      .catch(() => null);
  }, []);

  const resetBudget = useCallback(() => {
    setSelectedClient(null);
    setSelectedVehicle(null);
    setNotes("");
    setServiceRows([createEmptyServiceRow()]);
    setProductRows([createEmptyProductRow()]);
    setIssuedAt(new Date().toISOString());
  }, []);

  const searchClients = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getClients(term || undefined);
    for (const client of list) clientCache.current.set(client.id, client);
    return list.map((client) => ({
      id: client.id,
      primary: client.name,
      secondary: client.document ? maskCpfCnpj(client.document) : client.phone ?? undefined,
    }));
  }, []);

  const searchVehicles = useCallback(
    async (term: string): Promise<SearchableOption[]> => {
      const list = await getVehicles(term || undefined, selectedClient?.id);
      for (const vehicle of list) vehicleCache.current.set(vehicle.id, vehicle);
      return list.map((vehicle) => ({
        id: vehicle.id,
        primary: `${vehicle.license_plate ?? "Sem placa"} — ${vehicle.brand} ${vehicle.model}`,
        secondary: vehicle.owner.name,
      }));
    },
    [selectedClient?.id],
  );

  const searchServices = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getServices(term || undefined);
    for (const service of list) serviceCache.current.set(service.id, service);
    return list.map((service) => ({
      id: service.id,
      primary: service.name,
      secondary: `R$ ${service.sale_price}`,
    }));
  }, []);

  const searchProducts = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getProducts(term || undefined);
    for (const product of list) productCache.current.set(product.id, product);
    return list.map((product) => ({
      id: product.id,
      primary: product.name,
      secondary: `R$ ${product.sale_price} · Estoque: ${product.stock_quantity} un.`,
    }));
  }, []);

  function handleClientChange(id: string | null) {
    if (!id) {
      setSelectedClient(null);
      return;
    }
    const client = clientCache.current.get(id) ?? null;
    setSelectedClient(client);
    if (selectedVehicle && selectedVehicle.owner.id !== id) {
      setSelectedVehicle(null);
    }
  }

  function handleVehicleChange(id: string | null) {
    if (!id) {
      setSelectedVehicle(null);
      return;
    }
    const vehicle = vehicleCache.current.get(id) ?? null;
    setSelectedVehicle(vehicle);
  }

  function addServiceRow() {
    setServiceRows((rows) => [...rows, createEmptyServiceRow()]);
  }

  function removeServiceRow(key: number) {
    setServiceRows((rows) => {
      const next = rows.filter((item) => item.key !== key);
      return next.length > 0 ? next : [createEmptyServiceRow()];
    });
  }

  function addProductRow() {
    setProductRows((rows) => [...rows, createEmptyProductRow()]);
  }

  function removeProductRow(key: number) {
    setProductRows((rows) => {
      const next = rows.filter((item) => item.key !== key);
      return next.length > 0 ? next : [createEmptyProductRow()];
    });
  }

  const validServices = serviceRows.filter(
    (row) => row.description.trim() !== "" || parseDecimalValue(row.unitPrice) > 0,
  );
  const validProducts = productRows.filter(
    (row) => row.description.trim() !== "" || parseDecimalValue(row.unitPrice) > 0,
  );

  const servicesSubtotal = validServices.reduce((sum, row) => {
    const qty = Math.max(1, Number(row.quantity) || 1);
    return sum + qty * parseDecimalValue(row.unitPrice);
  }, 0);

  const productsSubtotal = validProducts.reduce((sum, row) => {
    const qty = Math.max(1, Number(row.quantity) || 1);
    return sum + qty * parseDecimalValue(row.unitPrice);
  }, 0);

  const grandTotal = servicesSubtotal + productsSubtotal;

  function handlePrintOrSavePdf() {
    if (validServices.length === 0 && validProducts.length === 0) {
      toast.error("Preencha pelo menos um serviço ou uma peça antes de imprimir ou salvar em PDF.");
      return;
    }

    const invalidService = validServices.some((row) => !row.description.trim());
    const invalidProduct = validProducts.some((row) => !row.description.trim());
    if (invalidService || invalidProduct) {
      toast.error("Informe a descrição em todos os serviços e peças preenchidos.");
      return;
    }

    setIssuedAt(new Date().toISOString());

    const handleAfterPrint = () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      setPostPrintModalOpen(true);
    };

    window.addEventListener("afterprint", handleAfterPrint, { once: true });
    window.print();
  }

  const workshopData = workshop ?? user?.workshop ?? null;
  const workshopAddress = formatFullAddress(workshopData?.address);
  const workshopPhone = formatFormattedPhone(workshopData?.phone);
  const clientAddress = formatFullAddress(selectedClient?.address);
  const clientPhone = formatFormattedPhone(selectedClient?.phone);

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
      {/* FORMULÁRIO INTERATIVO (OCULTO NA IMPRESSÃO / PDF) */}
      <div className="print:hidden">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Orçamento</h1>
            <p className="text-sm text-muted-foreground">
              Monte um orçamento rápido para impressão ou PDF. Os dados não são salvos no sistema.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                resetBudget();
                toast.success("Campos limpos para um novo orçamento.");
              }}
            >
              <IconPlus size={16} /> Novo Orçamento
            </Button>
          </div>
        </header>

        {/* CLIENTE E VEÍCULO (OPCIONAIS) */}
        <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold">Dados do Cliente e Veículo (Opcionais)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchableSelect
              label="Cliente"
              optional
              value={selectedClient?.id ?? null}
              initialLabel={selectedClient?.name ?? null}
              onChange={(id) => handleClientChange(id)}
              searchOptions={searchClients}
              placeholder="Busque pelo nome, CPF/CNPJ ou telefone..."
            />

            <SearchableSelect
              label="Veículo"
              optional
              value={selectedVehicle?.id ?? null}
              initialLabel={
                selectedVehicle
                  ? `${selectedVehicle.license_plate ?? "Sem placa"} — ${selectedVehicle.brand} ${selectedVehicle.model}`
                  : null
              }
              onChange={(id) => handleVehicleChange(id)}
              searchOptions={searchVehicles}
              placeholder={
                selectedClient
                  ? `Buscar veículo de ${selectedClient.name}...`
                  : "Busque pela placa, marca ou modelo..."
              }
            />
          </div>

          {(selectedClient || selectedVehicle) && (
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                {selectedClient ? (
                  <>
                    <p className="font-medium text-foreground">{selectedClient.name}</p>
                    <p>
                      CPF/CNPJ:{" "}
                      {selectedClient.document ? maskCpfCnpj(selectedClient.document) : "Não informado"}
                      {clientPhone ? ` · Tel.: ${clientPhone}` : ""}
                    </p>
                  </>
                ) : (
                  <p>Nenhum cliente selecionado.</p>
                )}
              </div>
              <div>
                {selectedVehicle ? (
                  <>
                    <p className="font-medium text-foreground">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p>
                      Placa: {selectedVehicle.license_plate ?? "Sem placa"}
                      {selectedVehicle.mileage ? ` · ${selectedVehicle.mileage} km` : ""}
                    </p>
                  </>
                ) : (
                  <p>Nenhum veículo selecionado.</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* SERVIÇOS */}
        <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Serviços</h2>
              <p className="text-xs text-muted-foreground">
                Escreva livremente os serviços ou puxe do catálogo para preencher o valor.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addServiceRow}>
              <IconPlus size={14} /> Adicionar serviço
            </Button>
          </div>

          <div className="space-y-3">
            {serviceRows.map((row) => {
              const rowQty = Math.max(1, Number(row.quantity) || 1);
              const rowSubtotal = rowQty * parseDecimalValue(row.unitPrice);

              return (
                <div
                  key={row.key}
                  className="grid grid-cols-1 items-end gap-3 rounded-lg border border-border/50 p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-3">
                    <SearchableSelect
                      label="Puxar do catálogo"
                      optional
                      value={row.service_id || null}
                      initialLabel={row.catalog_label || null}
                      onChange={(id, option) => {
                        const service = id ? serviceCache.current.get(id) : undefined;
                        setServiceRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key
                              ? {
                                  ...item,
                                  service_id: id ?? "",
                                  catalog_label: option?.primary ?? "",
                                  description: service ? service.name : item.description,
                                  unitPrice: service ? service.sale_price : item.unitPrice,
                                }
                              : item,
                          ),
                        );
                      }}
                      searchOptions={searchServices}
                      placeholder="Buscar serviço..."
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <FormField
                      label="Descrição do serviço"
                      value={row.description}
                      onChange={(e) =>
                        setServiceRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key ? { ...item, description: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Escreva o serviço a ser realizado..."
                      className="h-10 [&_input]:h-full"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <FormField
                      label="Qtd."
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        setServiceRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key ? { ...item, quantity: e.target.value } : item,
                          ),
                        )
                      }
                      className="h-10 [&_input]:h-full"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FormField
                      label="Valor Unit. (R$)"
                      value={row.unitPrice}
                      inputMode="decimal"
                      onChange={(e) =>
                        setServiceRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key ? { ...item, unitPrice: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="0,00"
                      className="h-10 [&_input]:h-full"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-muted-foreground">Total</span>
                      <div className="flex h-10 items-center text-sm font-semibold">
                        {formatCurrency(rowSubtotal)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeServiceRow(row.key)}
                      aria-label="Remover serviço"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PEÇAS */}
        <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Peças</h2>
              <p className="text-xs text-muted-foreground">
                Escreva livremente as peças ou puxe um produto cadastrado apenas para referência de preço.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addProductRow}>
              <IconPlus size={14} /> Adicionar peça
            </Button>
          </div>

          <div className="space-y-3">
            {productRows.map((row) => {
              const rowQty = Math.max(1, Number(row.quantity) || 1);
              const rowSubtotal = rowQty * parseDecimalValue(row.unitPrice);

              return (
                <div
                  key={row.key}
                  className="grid grid-cols-1 items-end gap-3 rounded-lg border border-border/50 p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-3">
                    <SearchableSelect
                      label="Puxar do estoque"
                      optional
                      value={row.product_id || null}
                      initialLabel={row.catalog_label || null}
                      onChange={(id, option) => {
                        const product = id ? productCache.current.get(id) : undefined;
                        setProductRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key
                              ? {
                                  ...item,
                                  product_id: id ?? "",
                                  catalog_label: option?.primary ?? "",
                                  description: product ? product.name : item.description,
                                  unitPrice: product ? product.sale_price : item.unitPrice,
                                }
                              : item,
                          ),
                        );
                      }}
                      searchOptions={searchProducts}
                      placeholder="Buscar produto..."
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <FormField
                      label="Descrição da peça"
                      value={row.description}
                      onChange={(e) =>
                        setProductRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key ? { ...item, description: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Escreva o nome da peça..."
                      className="h-10 [&_input]:h-full"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <FormField
                      label="Qtd."
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        setProductRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key ? { ...item, quantity: e.target.value } : item,
                          ),
                        )
                      }
                      className="h-10 [&_input]:h-full"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FormField
                      label="Valor Unit. (R$)"
                      value={row.unitPrice}
                      inputMode="decimal"
                      onChange={(e) =>
                        setProductRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key ? { ...item, unitPrice: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="0,00"
                      className="h-10 [&_input]:h-full"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-muted-foreground">Total</span>
                      <div className="flex h-10 items-center text-sm font-semibold">
                        {formatCurrency(rowSubtotal)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeProductRow(row.key)}
                      aria-label="Remover peça"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* OBSERVAÇÕES E RESUMO FINANCEIRO */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-2 font-semibold">Observações / Condições (Opcional)</h2>
            <FormTextarea
              label=""
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Orçamento válido por 7 dias. Sujeito a alterações após desmontagem."
            />
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
            <div>
              <h2 className="mb-3 font-semibold">Resumo do Orçamento</h2>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-muted-foreground">Subtotal Serviços</span>
                <span>{formatCurrency(servicesSubtotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-muted-foreground">Subtotal Peças</span>
                <span>{formatCurrency(productsSubtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total Geral</span>
                <span className="text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={handlePrintOrSavePdf} className="w-full sm:w-auto">
                <IconPrinter size={16} /> Imprimir / Salvar em PDF
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* DOCUMENTO FORMATADO PARA IMPRESSÃO / SALVAR EM PDF */}
      <div className="hidden print:mx-auto print:block print:max-w-4xl">
        <article className="flex min-h-screen flex-col justify-between bg-white p-8 text-black">
          <div>
            {/* CABEÇALHO DA OFICINA */}
            <header className="mb-6 flex items-start justify-between gap-6 border-b border-border pb-5">
              <div className="flex items-start gap-4">
                {workshopData?.logo_url && (
                  <img
                    src={workshopData.logo_url}
                    alt={workshopData.name}
                    className="max-h-16 max-w-28 shrink-0 object-contain"
                  />
                )}
                <div className="space-y-0.5">
                  <h1 className="text-xl font-bold leading-tight">
                    {workshopData?.name ?? "Oficina"}
                  </h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {workshopData?.cnpj && <span>CNPJ: {maskCpfCnpj(workshopData.cnpj)}</span>}
                    {workshopPhone && <span>Tel.: {workshopPhone}</span>}
                  </div>
                  {workshopAddress && (
                    <p className="text-xs text-muted-foreground">{workshopAddress}</p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-lg font-bold uppercase">Orçamento</p>
                <p className="text-xs text-muted-foreground">
                  Emitido em {formatDateTime(issuedAt)}
                </p>
                <p className="mt-1 inline-block rounded-md border border-border px-2 py-0.5 text-xs font-semibold uppercase">
                  Sem vínculo de OS
                </p>
              </div>
            </header>

            {/* DADOS DE CLIENTE E VEÍCULO */}
            <section className="mb-6 grid grid-cols-2 gap-6 rounded-xl border border-border p-4">
              <div className="space-y-1 pr-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente
                </h2>
                {selectedClient ? (
                  <>
                    <p className="font-semibold">{selectedClient.name}</p>
                    <div className="grid grid-cols-1 gap-0.5 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">CPF/CNPJ:</span>{" "}
                        {selectedClient.document
                          ? maskCpfCnpj(selectedClient.document)
                          : "Não informado"}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Telefone:</span>{" "}
                        {clientPhone ?? "Não informado"}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Endereço:</span>{" "}
                        {clientAddress ?? "Não informado"}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Não informado</p>
                )}
              </div>

              <div className="space-y-1 border-l border-border pl-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Veículo
                </h2>
                {selectedVehicle ? (
                  <>
                    <p className="font-semibold">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <div className="grid grid-cols-1 gap-0.5 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Marca / Modelo:</span>{" "}
                        {selectedVehicle.brand} / {selectedVehicle.model}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Placa:</span>{" "}
                        {selectedVehicle.license_plate ?? "Sem placa"}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Quilometragem:</span>{" "}
                        {selectedVehicle.mileage ? `${selectedVehicle.mileage} km` : "Não informada"}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Não informado</p>
                )}
              </div>
            </section>

            {/* TABELA DE SERVIÇOS */}
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Serviços Orçados
              </h2>
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[58%]" />
                  <col className="w-[10%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-2">Serviço</th>
                    <th className="py-2 text-right">Qtd.</th>
                    <th className="py-2 text-right">Valor Unit.</th>
                    <th className="py-2 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {validServices.length === 0 ? (
                    <tr className="border-b border-border/50">
                      <td colSpan={4} className="py-3 text-center text-xs text-muted-foreground">
                        Nenhum serviço incluído.
                      </td>
                    </tr>
                  ) : (
                    validServices.map((item) => {
                      const qty = Math.max(1, Number(item.quantity) || 1);
                      const unit = parseDecimalValue(item.unitPrice);
                      return (
                        <tr key={item.key} className="border-b border-border/50">
                          <td className="truncate py-2 pr-2">{item.description}</td>
                          <td className="py-2 text-right">{qty}</td>
                          <td className="py-2 text-right">{formatCurrency(unit)}</td>
                          <td className="py-2 text-right font-medium">
                            {formatCurrency(qty * unit)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>

            {/* TABELA DE PEÇAS */}
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Peças Orçadas
              </h2>
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[58%]" />
                  <col className="w-[10%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-2">Peça / Produto</th>
                    <th className="py-2 text-right">Qtd.</th>
                    <th className="py-2 text-right">Valor Unit.</th>
                    <th className="py-2 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {validProducts.length === 0 ? (
                    <tr className="border-b border-border/50">
                      <td colSpan={4} className="py-3 text-center text-xs text-muted-foreground">
                        Nenhuma peça incluída.
                      </td>
                    </tr>
                  ) : (
                    validProducts.map((item) => {
                      const qty = Math.max(1, Number(item.quantity) || 1);
                      const unit = parseDecimalValue(item.unitPrice);
                      return (
                        <tr key={item.key} className="border-b border-border/50">
                          <td className="truncate py-2 pr-2">{item.description}</td>
                          <td className="py-2 text-right">{qty}</td>
                          <td className="py-2 text-right">{formatCurrency(unit)}</td>
                          <td className="py-2 text-right font-medium">
                            {formatCurrency(qty * unit)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>

            {/* OBSERVAÇÕES E TOTAIS */}
            <section className="mb-6 grid grid-cols-2 gap-6">
              <div>
                {notes.trim() && (
                  <>
                    <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Observações
                    </h2>
                    <p className="rounded-lg border border-border/60 px-3 py-2 text-xs whitespace-pre-wrap">
                      {notes}
                    </p>
                  </>
                )}
              </div>

              <div className="ml-auto w-full max-w-xs rounded-xl border border-border p-4 text-sm">
                <div className="flex justify-between py-1 text-xs text-muted-foreground">
                  <span>Subtotal Serviços</span>
                  <span>{formatCurrency(servicesSubtotal)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs text-muted-foreground">
                  <span>Subtotal Peças</span>
                  <span>{formatCurrency(productsSubtotal)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Total do Orçamento</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </section>
          </div>

          <footer className="mt-auto grid grid-cols-2 gap-12 pt-16">
            <div className="border-t border-foreground pt-2 text-center text-sm">
              De acordo (Cliente)
            </div>
            <div className="border-t border-foreground pt-2 text-center text-sm">
              Responsável pela oficina
            </div>
          </footer>
        </article>
      </div>

      {/* MODAL PÓS-IMPRESSÃO / PDF: NOVO ORÇAMENTO OU CONTINUAR EDITANDO */}
      {postPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setPostPrintModalOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Orçamento finalizado"
            className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <IconFileDollar size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Orçamento finalizado</h2>
                <p className="text-xs text-muted-foreground">
                  Impressão ou salvamento em PDF concluído.
                </p>
              </div>
            </div>

            <p className="mb-6 text-sm text-muted-foreground">
              Deseja limpar os dados para iniciar um novo orçamento ou continuar editando o orçamento atual?
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPostPrintModalOpen(false);
                }}
              >
                <IconPencil size={16} /> Continuar editando
              </Button>
              <Button
                type="button"
                onClick={() => {
                  resetBudget();
                  setPostPrintModalOpen(false);
                }}
              >
                <IconPlus size={16} /> Novo Orçamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
