import { MainLayout } from "@/components/layout/main-layout";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useVendas, useCancelVenda, Venda } from "@/hooks/use-vendas";
import { useClientes } from "@/hooks/use-clientes";
import { VendaForm } from "@/components/forms/venda-form";
import { VendaDetailsDialog } from "@/components/financial/venda-details-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Eye, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Vendas() {
  const [vendaFormOpen, setVendaFormOpen] = useState(false);
  const [vendaDetailsOpen, setVendaDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedVendaId, setSelectedVendaId] = useState<string | null>(null);
  const [vendaToCancel, setVendaToCancel] = useState<Venda | null>(null);
  const { data: vendas, isLoading, error } = useVendas();
  const { data: clientes } = useClientes();
  const cancelVenda = useCancelVenda();
  const { toast } = useToast();

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes?.find(c => c.id === clienteId);
    return cliente?.nome || "Cliente não encontrado";
  };

  const handleViewDetails = (venda: Venda) => {
    setSelectedVendaId(venda.id);
    setVendaDetailsOpen(true);
  };

  const handleCancelVenda = (venda: Venda) => {
    setVendaToCancel(venda);
    setCancelDialogOpen(true);
  };

  const confirmCancelVenda = async () => {
    if (!vendaToCancel) return;
    
    try {
      await cancelVenda.mutateAsync(vendaToCancel.id);
      setCancelDialogOpen(false);
      setVendaToCancel(null);
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);
    }
  };

  const columns = [
    { key: "numero_venda", label: "Número", sortable: true },
    {
      key: "data_venda",
      label: "Data",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString("pt-BR")
    },
    {
      key: "cliente_id",
      label: "Cliente",
      render: (value: string) => getClienteNome(value)
    },
    {
      key: "valor_final",
      label: "Valor Total",
      sortable: true,
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      key: "desconto",
      label: "Desconto",
      render: (value: number) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "-"
    },
    {
      key: "forma_pagamento",
      label: "Pagamento",
      render: (value: string) => (
        <Badge variant="outline">
          {value === "pix" ? "PIX" :
           value === "credito" ? "Crédito" :
           value === "debito" ? "Débito" :
           value === "prazo" ? "A Prazo" : value}
        </Badge>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge variant={
          value === "finalizada" ? "default" :
          value === "pendente" ? "secondary" :
          "destructive"
        }>
          {value === "finalizada" ? "Finalizada" : 
           value === "pendente" ? "Pendente" : 
           "Cancelada"}
        </Badge>
      )
    },
    {
      key: "actions",
      label: "Ações",
      render: (_, row: Venda) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(row)}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === "finalizada" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCancelVenda(row)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const filters = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "finalizada", label: "Finalizada" },
        { value: "pendente", label: "Pendente" },
        { value: "cancelada", label: "Cancelada" }
      ]
    },
    {
      key: "forma_pagamento",
      label: "Forma de Pagamento",
      options: [
        { value: "pix", label: "PIX" },
        { value: "credito", label: "Crédito" },
        { value: "debito", label: "Débito" },
        { value: "prazo", label: "A Prazo" }
      ]
    }
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Vendas</h1>
            <p className="text-destructive">
              Erro ao carregar vendas
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as vendas do seu negócio
          </p>
        </div>

        <DataTable
          title="Lista de Vendas"
          data={vendas || []}
          columns={columns}
          searchPlaceholder="Pesquisar por número, cliente..."
          filters={filters}
          actions={
            <Button onClick={() => setVendaFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          }
          onExportCSV={() => {
            toast({
              title: "Exportando vendas",
              description: "O arquivo CSV será baixado em breve.",
            });
          }}
        />

        <VendaForm 
          open={vendaFormOpen} 
          onOpenChange={setVendaFormOpen} 
        />

        <VendaDetailsDialog
          open={vendaDetailsOpen}
          onOpenChange={setVendaDetailsOpen}
          vendaId={selectedVendaId}
        />

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Venda</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar a venda <strong>{vendaToCancel?.numero_venda}</strong>? 
                <br />
                <br />
                Esta ação irá:
                <ul className="list-disc ml-6 mt-2">
                  <li>Restaurar o estoque dos produtos</li>
                  <li>Cancelar contas a receber relacionadas (se houver)</li>
                  <li>Marcar a venda como cancelada</li>
                </ul>
                <br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmCancelVenda}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}