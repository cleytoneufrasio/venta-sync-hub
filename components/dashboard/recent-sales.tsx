import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const recentSales = [
  {
    id: "1",
    customer: "João Silva",
    product: "Notebook Dell",
    amount: "R$ 2.850,00",
    status: "completed",
    date: "2024-01-15"
  },
  {
    id: "2",
    customer: "Maria Santos",
    product: "Mouse Wireless",
    amount: "R$ 85,00",
    status: "pending",
    date: "2024-01-15"
  },
  {
    id: "3",
    customer: "Pedro Costa",
    product: "Teclado Mecânico",
    amount: "R$ 350,00",
    status: "completed",
    date: "2024-01-14"
  },
  {
    id: "4",
    customer: "Ana Oliveira",
    product: "Monitor 24''",
    amount: "R$ 680,00",
    status: "completed",
    date: "2024-01-14"
  },
  {
    id: "5",
    customer: "Carlos Lima",
    product: "Smartphone Samsung",
    amount: "R$ 1.200,00",
    status: "pending",
    date: "2024-01-13"
  }
];

interface Venda {
  id: string;
  numero_venda: string;
  data_venda: string;
  cliente: { nome: string };
  valor_final: number;
  status: string;
}

interface RecentSalesProps {
  vendas: Venda[];
}

export function RecentSales({ vendas }: RecentSalesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas Recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {vendas.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma venda encontrada</p>
        ) : (
          vendas.map((venda) => (
            <div key={venda.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-1">
                <p className="font-medium">{venda.cliente.nome}</p>
                <p className="text-sm text-muted-foreground">{venda.numero_venda}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-medium">R$ {venda.valor_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <Badge variant={venda.status === 'finalizada' ? 'default' : 'destructive'}>
                  {venda.status === 'finalizada' ? 'Finalizada' : 'Cancelada'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}