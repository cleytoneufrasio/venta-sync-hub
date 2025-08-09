import { MainLayout } from "@/components/layout/main-layout";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useContasPagar, useMarcarContaPaga, useDeleteContaPagar, ContaPagar } from "@/hooks/use-financeiro";
import { ContaPagarForm } from "@/components/forms/conta-pagar-form";
import { ContaDetailsDialog } from "@/components/financial/conta-details-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Check, Eye, AlertTriangle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ContasPagar() {
  const [contaFormOpen, setContaFormOpen] = useState(false);
  const [contaDetailsOpen, setContaDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const { data: contas, isLoading, error } = useContasPagar();
  const marcarPaga = useMarcarContaPaga();
  const deleteConta = useDeleteContaPagar();
  const { toast } = useToast();

  const calcularDiasVencimento = (dataVencimento: string, status: string) => {
    if (status === "paga") return null;
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleMarcarPaga = async (id: string) => {
    try {
      await marcarPaga.mutateAsync(id);
      toast({
        title: "Conta marcada como paga",
        description: "A conta foi marcada como paga com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao marcar conta como paga. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleViewConta = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setContaDetailsOpen(true);
  };

  const handleEditConta = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setContaFormOpen(true);
  };

  const handleDeleteConta = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedConta) return;
    
    try {
      await deleteConta.mutateAsync(selectedConta.id);
      setDeleteDialogOpen(false);
      setSelectedConta(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir conta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "descricao", label: "Descrição", sortable: true },
    {
      key: "valor",
      label: "Valor",
      sortable: true,
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      key: "data_vencimento",
      label: "Vencimento",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString("pt-BR")
    },
    { key: "categoria", label: "Categoria", sortable: true, render: (value: string) => value || "-" },
    {
      key: "status",
      label: "Status",
      render: (value: string, row: any) => {
        let variant: "default" | "secondary" | "destructive" = "default";
        let icon = null;
        
        if (value === "paga") {
          variant = "default";
          icon = <Check className="h-3 w-3 mr-1" />;
        } else {
          const dias = calcularDiasVencimento(row.data_vencimento, value);
          if (dias !== null && dias < 0) {
            variant = "destructive";
            icon = <AlertTriangle className="h-3 w-3 mr-1" />;
          } else {
            variant = "secondary";
          }
        }
        
        return (
          <Badge variant={variant} className="flex items-center w-fit">
            {icon}
            {value === "paga" ? "Paga" : value === "pendente" ? "Em aberto" : value}
          </Badge>
        );
      }
    },
    {
      key: "data_vencimento",
      label: "Situação",
      render: (value: string, row: any) => {
        const dias = calcularDiasVencimento(value, row.status);
        if (row.status === "paga") return "-";
        if (dias === null) return "-";
        
        if (dias < 0) {
          return (
            <span className="text-destructive font-medium">
              {Math.abs(dias)} dias em atraso
            </span>
          );
        } else if (dias <= 3) {
          return (
            <span className="text-warning font-medium">
              Vence em {dias} dias
            </span>
          );
        } else {
          return (
            <span className="text-muted-foreground">
              Vence em {dias} dias
            </span>
          );
        }
      }
    },
    {
      key: "actions",
      label: "Ações",
      render: (_, row: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleViewConta(row)}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            {row.status !== "paga" && (
              <>
                <DropdownMenuItem onClick={() => handleEditConta(row)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMarcarPaga(row.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Marcar como Paga
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteConta(row)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const filters = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "pendente", label: "Em aberto" },
        { value: "paga", label: "Paga" }
      ]
    },
    {
      key: "categoria",
      label: "Categoria",
      options: [
        { value: "estoque", label: "Estoque" },
        { value: "despesas", label: "Despesas" },
        { value: "servicos", label: "Serviços" },
        { value: "fornecedores", label: "Fornecedores" }
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
            <h1 className="text-3xl font-bold">Contas a Pagar</h1>
            <p className="text-destructive">
              Erro ao carregar contas a pagar
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Cálculos dos totais
  const totalEmAberto = contas?.filter(c => c.status === "pendente").reduce((sum, c) => sum + c.valor, 0) || 0;
  const totalVencidas = contas?.filter(c => {
    if (c.status !== "pendente") return false;
    const dias = calcularDiasVencimento(c.data_vencimento, c.status);
    return dias !== null && dias < 0;
  }).reduce((sum, c) => sum + c.valor, 0) || 0;
  const contasVencidas = contas?.filter(c => {
    if (c.status !== "pendente") return false;
    const dias = calcularDiasVencimento(c.data_vencimento, c.status);
    return dias !== null && dias < 0;
  }).length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Gerencie todas as contas a pagar para fornecedores
          </p>
        </div>

        {/* Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total em Aberto</p>
              <p className="text-2xl font-bold text-warning">
                R$ {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Vencidas</p>
              <p className="text-2xl font-bold text-destructive">
                R$ {totalVencidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Contas Vencidas</p>
              <p className="text-2xl font-bold text-destructive">
                {contasVencidas}
              </p>
            </div>
          </div>
        </div>

        <DataTable
          title="Contas a Pagar"
          data={contas || []}
          columns={columns}
          searchPlaceholder="Pesquisar por descrição, categoria..."
          filters={filters}
          actions={
            <Button onClick={() => setContaFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          }
          onExportCSV={() => {
            toast({
              title: "Exportando contas a pagar",
              description: "O arquivo CSV será baixado em breve.",
            });
          }}
        />

        <ContaPagarForm 
          open={contaFormOpen} 
          onOpenChange={(open) => {
            setContaFormOpen(open);
            if (!open) setSelectedConta(null);
          }}
          conta={selectedConta}
        />

        <ContaDetailsDialog
          open={contaDetailsOpen}
          onOpenChange={setContaDetailsOpen}
          conta={selectedConta}
          type="pagar"
          fornecedorNome={selectedConta?.fornecedor?.nome}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}