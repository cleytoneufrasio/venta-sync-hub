import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";

const inventoryAlerts = [
  {
    id: "1",
    product: "Notebook Dell Inspiron",
    currentStock: 2,
    minStock: 5,
    status: "low" as const
  },
  {
    id: "2", 
    product: "Mouse Wireless Logitech",
    currentStock: 0,
    minStock: 10,
    status: "out" as const
  },
  {
    id: "3",
    product: "Teclado Mecânico RGB",
    currentStock: 3,
    minStock: 8,
    status: "low" as const
  },
  {
    id: "4",
    product: "Monitor 24'' Samsung",
    currentStock: 1,
    minStock: 4,
    status: "critical" as const
  }
];

interface AlertaEstoque {
  id: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
}

interface InventoryAlertsProps {
  alertas: AlertaEstoque[];
}

export function InventoryAlerts({ alertas }: InventoryAlertsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <CardTitle className="text-base">Alertas de Estoque</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertas.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum alerta de estoque</p>
        ) : (
          alertas.map((alerta) => (
            <div key={alerta.id} className="flex items-center justify-between p-3 rounded-lg border border-warning/20 bg-warning/5">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <div>
                  <p className="font-medium text-sm">{alerta.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Estoque: {alerta.estoque_atual} / Mínimo: {alerta.estoque_minimo}
                  </p>
                </div>
              </div>
              <Badge variant={alerta.estoque_atual === 0 ? "destructive" : "secondary"}>
                {alerta.estoque_atual === 0 ? "Esgotado" : "Baixo"}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}