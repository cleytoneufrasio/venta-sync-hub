import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProdutosMaisVendidos } from "@/hooks/use-relatorios";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface ProdutosMaisVendidosProps {
  periodo: { inicio: string; fim: string };
}

export function ProdutosMaisVendidos({ periodo }: ProdutosMaisVendidosProps) {
  const { data: produtos, isLoading, error } = useProdutosMaisVendidos(periodo);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
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
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  const top10Produtos = produtos?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos - Quantidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Produtos} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nome" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Bar dataKey="quantidadeVendida" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {top10Produtos.map((produto, index) => (
              <div key={produto.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{produto.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {produto.quantidadeVendida} unidades vendidas
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-medium">
                    R$ {produto.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Margem: R$ {produto.margemLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            {top10Produtos.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum produto vendido no período selecionado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}