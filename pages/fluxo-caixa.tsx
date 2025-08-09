import { useState } from "react";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Filter } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/common/data-table";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useFluxoCaixa, PERIODOS_FLUXO, MovimentacaoFinanceira } from "@/hooks/use-fluxo-caixa";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function FluxoCaixa() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState(PERIODOS_FLUXO[2]); // Mês atual
  const { data: fluxoCaixa, isLoading, error } = useFluxoCaixa(
    periodoSelecionado.dataInicio,
    periodoSelecionado.dataFim
  );

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
  };

  const columns = [
    {
      key: "data",
      label: "Data",
      sortable: true,
      render: (value: string) => formatarData(value),
    },
    {
      key: "descricao",
      label: "Descrição",
      sortable: true,
    },
    {
      key: "cliente_fornecedor",
      label: "Cliente/Fornecedor",
      sortable: true,
    },
    {
      key: "categoria",
      label: "Categoria",
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline">
          {value}
        </Badge>
      ),
    },
    {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      render: (value: string) => (
        <Badge variant={value === 'entrada' ? 'default' : 'destructive'}>
          {value === 'entrada' ? 'Entrada' : 'Saída'}
        </Badge>
      ),
    },
    {
      key: "valor",
      label: "Valor",
      sortable: true,
      render: (value: number, row: MovimentacaoFinanceira) => (
        <span className={row.tipo === 'entrada' ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
          {row.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(value)}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Erro ao carregar dados do fluxo de caixa</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
            <p className="text-muted-foreground">
              Controle suas entradas e saídas financeiras
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={periodoSelecionado.value}
              onValueChange={(value) => {
                const periodo = PERIODOS_FLUXO.find(p => p.value === value);
                if (periodo) setPeriodoSelecionado(periodo);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS_FLUXO.map((periodo) => (
                  <SelectItem key={periodo.value} value={periodo.value}>
                    {periodo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total de Entradas"
            value={formatarMoeda(fluxoCaixa?.entradas || 0)}
            icon={TrendingUp}
            changeType="positive"
          />
          <StatsCard
            title="Total de Saídas"
            value={formatarMoeda(fluxoCaixa?.saidas || 0)}
            icon={TrendingDown}
            changeType="negative"
          />
          <StatsCard
            title="Saldo Líquido"
            value={formatarMoeda(fluxoCaixa?.saldo || 0)}
            icon={DollarSign}
            changeType={fluxoCaixa?.saldo && fluxoCaixa.saldo >= 0 ? "positive" : "negative"}
            gradient={true}
          />
        </div>

        {/* Período Selecionado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período: {periodoSelecionado.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {formatarData(periodoSelecionado.dataInicio.toISOString())} até{" "}
              {formatarData(periodoSelecionado.dataFim.toISOString())}
            </p>
          </CardContent>
        </Card>

        {/* Tabela de Movimentações */}
        <DataTable
          title="Movimentações Financeiras"
          columns={columns}
          data={fluxoCaixa?.movimentacoes || []}
          searchPlaceholder="Buscar movimentações..."
          filters={[
            {
              key: "tipo",
              label: "Tipo",
              options: [
                { value: "entrada", label: "Entradas" },
                { value: "saida", label: "Saídas" },
              ],
            },
            {
              key: "origem",
              label: "Origem",
              options: [
                { value: "venda", label: "Vendas" },
                { value: "conta_receber", label: "Contas a Receber" },
                { value: "conta_pagar", label: "Contas a Pagar" },
              ],
            },
          ]}
        />
      </div>
    </MainLayout>
  );
}