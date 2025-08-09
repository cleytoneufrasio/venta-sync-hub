import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrescimentoMensal } from "@/hooks/use-relatorios";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";

export function CrescimentoCharts() {
  const { data: crescimento, isLoading, error } = useCrescimentoMensal();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Crescimento</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Crescimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  if (!crescimento || crescimento.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Crescimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Dados insuficientes para análise</p>
        </CardContent>
      </Card>
    );
  }

  const ultimoMes = crescimento[crescimento.length - 1];
  const penultimoMes = crescimento[crescimento.length - 2];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Último Mês</CardTitle>
            {ultimoMes.crescimentoVendas >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ultimoMes.vendas}</div>
            <p className={`text-xs ${ultimoMes.crescimentoVendas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ultimoMes.crescimentoVendas >= 0 ? '+' : ''}{ultimoMes.crescimentoVendas.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Último Mês</CardTitle>
            {ultimoMes.crescimentoFaturamento >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {ultimoMes.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${ultimoMes.crescimentoFaturamento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ultimoMes.crescimentoFaturamento >= 0 ? '+' : ''}{ultimoMes.crescimentoFaturamento.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {ultimoMes.vendas > 0 ? (ultimoMes.faturamento / ultimoMes.vendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crescimento.filter(m => m.crescimentoVendas > 0).length}/{crescimento.length - 1}
            </div>
            <p className="text-xs text-muted-foreground">
              Meses com crescimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={crescimento} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'vendas' ? value : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    name === 'vendas' ? 'Vendas' : 'Faturamento'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="vendas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução de Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crescimento} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    'Faturamento'
                  ]}
                />
                <Bar dataKey="faturamento" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Tendências */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Tendências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Desempenho Recente</h3>
              <div className="space-y-2 text-sm">
                <p>Último mês: {ultimoMes.vendas} vendas</p>
                <p>Mês anterior: {penultimoMes?.vendas || 0} vendas</p>
                <p className={ultimoMes.crescimentoVendas >= 0 ? 'text-green-600' : 'text-red-600'}>
                  Variação: {ultimoMes.crescimentoVendas >= 0 ? '+' : ''}{ultimoMes.crescimentoVendas.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Faturamento Recente</h3>
              <div className="space-y-2 text-sm">
                <p>Último mês: R$ {ultimoMes.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p>Mês anterior: R$ {(penultimoMes?.faturamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className={ultimoMes.crescimentoFaturamento >= 0 ? 'text-green-600' : 'text-red-600'}>
                  Variação: {ultimoMes.crescimentoFaturamento >= 0 ? '+' : ''}{ultimoMes.crescimentoFaturamento.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}