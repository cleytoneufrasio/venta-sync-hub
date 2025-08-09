import { MainLayout } from "@/components/layout/main-layout";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProdutoForm } from "@/components/forms/produto-form";
import { useProdutos, useDeleteProduto, Produto } from "@/hooks/use-produtos";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Produtos() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | undefined>();
  const { data: produtos, isLoading, error } = useProdutos();
  const deleteProduto = useDeleteProduto();
  const { toast } = useToast();

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await deleteProduto.mutateAsync(id);
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduto(undefined);
  };

  const columns = [
    { key: "codigo", label: "Código", render: (value: string) => value || "-" },
    { key: "nome", label: "Produto", sortable: true },
    {
      key: "preco_venda",
      label: "Preço",
      sortable: true,
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      key: "estoque_atual",
      label: "Estoque",
      sortable: true,
      render: (value: number, row: Produto) => (
        <div className="flex items-center space-x-2">
          <span>{value}</span>
          {value === 0 && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          {value > 0 && value <= (row.estoque_minimo || 0) && (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
      )
    },
    { 
      key: "estoque_minimo", 
      label: "Estoque Mín.", 
      sortable: true,
      render: (value: number) => value || 0
    },
    { key: "unidade", label: "Unidade", render: (value: string) => value || "UN" },
    {
      key: "ativo",
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
    {
      key: "actions",
      label: "Ações",
      render: (_, row: Produto) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const filters = [
    {
      key: "ativo",
      label: "Status",
      options: [
        { value: "true", label: "Ativo" },
        { value: "false", label: "Inativo" }
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
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-destructive">
              Erro ao carregar produtos
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
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seu catálogo de produtos e controle de estoque
          </p>
        </div>

        <DataTable
          title="Lista de Produtos"
          data={produtos || []}
          columns={columns}
          searchPlaceholder="Pesquisar por produto, código..."
          filters={filters}
          actions={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          }
          onExportCSV={() => {
            toast({
              title: "Exportando produtos",
              description: "O arquivo CSV será baixado em breve.",
            });
          }}
        />

        <ProdutoForm
          open={showForm}
          onOpenChange={handleCloseForm}
          produto={editingProduto}
        />
      </div>
    </MainLayout>
  );
}