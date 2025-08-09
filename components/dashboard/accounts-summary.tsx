import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, FileText, Calendar, AlertCircle } from "lucide-react";

interface ContaAberta {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  tipo: 'receber' | 'pagar';
  dias_vencimento: number;
}

interface AccountsSummaryProps {
  contasAbertas: ContaAberta[];
}

export function AccountsSummary({ contasAbertas }: AccountsSummaryProps) {
  const contasReceber = contasAbertas.filter(conta => conta.tipo === 'receber');
  const contasPagar = contasAbertas.filter(conta => conta.tipo === 'pagar');
  
  const totalReceber = contasReceber.reduce((acc, conta) => acc + conta.valor, 0);
  const totalPagar = contasPagar.reduce((acc, conta) => acc + conta.valor, 0);
  
  const contasVencidas = contasAbertas.filter(conta => conta.dias_vencimento > 0);
  const contasVencendoHoje = contasAbertas.filter(conta => conta.dias_vencimento === 0);

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-success">R$ {totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">{contasReceber.length} contas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Pagar</p>
                <p className="text-2xl font-bold text-destructive">R$ {totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">{contasPagar.length} contas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Projetado</p>
                <p className={`text-2xl font-bold ${totalReceber - totalPagar >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {(totalReceber - totalPagar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">líquido pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contas em Destaque */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contas Vencidas */}
        {contasVencidas.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-base">Contas Vencidas</CardTitle>
              </div>
              <Badge variant="destructive" className="ml-auto">
                {contasVencidas.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {contasVencidas.slice(0, 3).map((conta) => (
                <div key={conta.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="font-medium text-sm">{conta.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      Venceu há {conta.dias_vencimento} dia(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-destructive">R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <Badge variant={conta.tipo === 'receber' ? 'default' : 'secondary'} className="text-xs">
                      {conta.tipo === 'receber' ? 'Receber' : 'Pagar'}
                    </Badge>
                  </div>
                </div>
              ))}
              {contasVencidas.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{contasVencidas.length - 3} contas vencidas
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contas Vencendo Hoje */}
        {contasVencendoHoje.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-warning" />
                <CardTitle className="text-base">Vencimento Hoje</CardTitle>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {contasVencendoHoje.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {contasVencendoHoje.slice(0, 3).map((conta) => (
                <div key={conta.id} className="flex items-center justify-between p-3 rounded-lg border border-warning/20 bg-warning/5">
                  <div>
                    <p className="font-medium text-sm">{conta.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence hoje - {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <Badge variant={conta.tipo === 'receber' ? 'default' : 'secondary'} className="text-xs">
                      {conta.tipo === 'receber' ? 'Receber' : 'Pagar'}
                    </Badge>
                  </div>
                </div>
              ))}
              {contasVencendoHoje.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{contasVencendoHoje.length - 3} contas vencendo hoje
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Próximas Contas (quando não há vencidas/vencendo hoje) */}
        {contasVencidas.length === 0 && contasVencendoHoje.length === 0 && contasAbertas.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Próximas Contas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contasAbertas.slice(0, 5).map((conta) => (
                <div key={conta.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{conta.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence em {Math.abs(conta.dias_vencimento)} dia(s) - {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <Badge variant={conta.tipo === 'receber' ? 'default' : 'secondary'} className="text-xs">
                      {conta.tipo === 'receber' ? 'Receber' : 'Pagar'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}