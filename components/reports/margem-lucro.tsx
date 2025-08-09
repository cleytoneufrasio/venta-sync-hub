import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMargemLucroProdutos } from "@/hooks/use-relatorios";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export function MargemLucro() {
  const { data: produtos, isLoading, error } = useMargemLucroProdutos();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Margem de Lucro</CardTitle>
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
          <CardTitle>Análise de Margem de Lucro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  const top15Produtos = produtos?.slice(0, 15) || [];

  const getMargemColor = (margem: number) => {
    if (margem >= 50) return 'text-green-600';
    if (margem >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMargemBadge = (margem: number) => {
    if (margem >= 50) return { variant: 'default' as const, label: 'Excelente' };
    if (margem >= 20) return { variant: 'secondary' as const, label: 'Boa' };
    return { variant: 'destructive' as const, label: 'Baixa' };
  };

  return (
    <div className="space-y-6">
      {/* Gráfico de Margem */}
      <Card>
        <CardHeader>
          <CardTitle>Margem de Lucro por Produto (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top15Produtos} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nome" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margem']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="margemPercentual" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada de Margem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {top15Produtos.map((produto, index) => {
              const badgeInfo = getMargemBadge(produto.margemPercentual);
              return (
                <div key={produto.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{produto.nome}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Custo: R$ {produto.precoCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span>Venda: R$ {produto.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${getMargemColor(produto.margemPercentual)}`}>
                        {produto.margemPercentual.toFixed(1)}%
                      </span>
                      <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      +R$ {produto.margemValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
            {top15Produtos.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum produto encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {produtos && produtos.length > 0 && (
              <>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Produtos com Melhor Margem
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {produtos.filter(p => p.margemPercentual >= 50).length} produto(s) com margem acima de 50%
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Produtos para Revisão
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {produtos.filter(p => p.margemPercentual < 20).length} produto(s) com margem abaixo de 20% - considere revisar preços
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Margem Média da Carteira
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {(produtos.reduce((acc, p) => acc + p.margemPercentual, 0) / produtos.length).toFixed(1)}% 
                    - margem média dos produtos ativos
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}