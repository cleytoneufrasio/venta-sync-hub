import { MainLayout } from "@/components/layout/main-layout";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ClienteForm } from "@/components/forms/cliente-form";
import { useClientes, useDeleteCliente, Cliente } from "@/hooks/use-clientes";
import { Plus, Edit, Trash2, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Clientes() {
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | undefined>();
  const { data: clientes, isLoading, error } = useClientes();
  const deleteCliente = useDeleteCliente();
  const { toast } = useToast();

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteCliente.mutateAsync(id);
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCliente(undefined);
  };

  const columns = [
    { key: "nome", label: "Nome", sortable: true },
    {
      key: "email",
      label: "Email",
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: "telefone",
      label: "Telefone",
      render: (value: string) => (
        value ? (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{value}</span>
          </div>
        ) : "-"
      )
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (value: string) => (
        <Badge variant="outline">
          {value === "pessoa_fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
        </Badge>
      )
    },
    { key: "cpf_cnpj", label: "CPF/CNPJ", render: (value: string) => value || "-" },
    {
      key: "created_at",
      label: "Cadastrado em",
      render: (value: string) => new Date(value).toLocaleDateString("pt-BR")
    },
    {
      key: "actions",
      label: "Ações",
      render: (_, row: Cliente) => (
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
      key: "tipo",
      label: "Tipo",
      options: [
        { value: "pessoa_fisica", label: "Pessoa Física" },
        { value: "pessoa_juridica", label: "Pessoa Jurídica" }
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
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-destructive">
              Erro ao carregar clientes
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
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes e histórico de compras
          </p>
        </div>

        <DataTable
          title="Lista de Clientes"
          data={clientes || []}
          columns={columns}
          searchPlaceholder="Pesquisar por nome, email..."
          filters={filters}
          actions={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          }
          onExportCSV={() => {
            toast({
              title: "Exportando clientes",
              description: "O arquivo CSV será baixado em breve.",
            });
          }}
        />

        <ClienteForm
          open={showForm}
          onOpenChange={handleCloseForm}
          cliente={editingCliente}
        />
      </div>
    </MainLayout>
  );
}