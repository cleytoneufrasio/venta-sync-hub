import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemonstrativoFinanceiro } from "@/hooks/use-relatorios";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TrendingUp, TrendingDown, DollarSign, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DemonstrativoFinanceiroProps {
  periodo: { inicio: string; fim: string };
}

export function DemonstrativoFinanceiro({ periodo }: DemonstrativoFinanceiroProps) {
  const { data: demonstrativo, isLoading, error } = useDemonstrativoFinanceiro(periodo);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demonstrativo Financeiro</CardTitle>
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
          <CardTitle>Demonstrativo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  if (!demonstrativo) return null;

  const pieData = [
    { name: 'Receitas', value: demonstrativo.receitas, color: 'hsl(var(--primary))' },
    { name: 'Despesas', value: demonstrativo.despesas, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {demonstrativo.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {demonstrativo.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            {demonstrativo.lucroLiquido >= 0 ? (
              <DollarSign className="h-4 w-4 text-green-600" />
            ) : (
              <Minus className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${demonstrativo.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {demonstrativo.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${demonstrativo.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {demonstrativo.margemLucro.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Pizza */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição Receitas vs Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    'Valor'
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Análise Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Análise do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Resumo Executivo</h3>
              <p className="text-sm text-muted-foreground">
                No período de {demonstrativo.periodo}, a empresa obteve:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Receitas totais de R$ {demonstrativo.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                <li>• Despesas totais de R$ {demonstrativo.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                <li>• Resultado líquido de R$ {demonstrativo.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                <li>• Margem de lucro de {demonstrativo.margemLucro.toFixed(1)}%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}