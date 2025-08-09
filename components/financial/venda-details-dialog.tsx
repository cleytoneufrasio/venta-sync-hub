import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useVenda } from "@/hooks/use-vendas";
import { useClientes } from "@/hooks/use-clientes";
import { useProdutos } from "@/hooks/use-produtos";

interface VendaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendaId: string | null;
}

export function VendaDetailsDialog({ open, onOpenChange, vendaId }: VendaDetailsDialogProps) {
  const { data: venda, isLoading } = useVenda(vendaId || "");
  const { data: clientes } = useClientes();
  const { data: produtos } = useProdutos();

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes?.find(c => c.id === clienteId);
    return cliente?.nome || "Cliente não encontrado";
  };

  const getProdutoNome = (produtoId: string) => {
    const produto = produtos?.find(p => p.id === produtoId);
    return produto?.nome || "Produto não encontrado";
  };

  if (!vendaId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : venda ? (
          <div className="space-y-6">
            {/* Informações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Informações Gerais</h3>
                <div className="space-y-1">
                  <p><strong>Número:</strong> {venda.numero_venda}</p>
                  <p><strong>Data:</strong> {new Date(venda.data_venda).toLocaleDateString("pt-BR")}</p>
                  <p><strong>Cliente:</strong> {getClienteNome(venda.cliente_id)}</p>
                  <p><strong>Status:</strong> 
                    <Badge 
                      className="ml-2"
                      variant={
                        venda.status === "finalizada" ? "default" :
                        venda.status === "pendente" ? "secondary" :
                        "destructive"
                      }
                    >
                      {venda.status === "finalizada" ? "Finalizada" : 
                       venda.status === "pendente" ? "Pendente" : 
                       "Cancelada"}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Valores</h3>
                <div className="space-y-1">
                  <p><strong>Valor Total:</strong> R$ {venda.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  {venda.desconto > 0 && (
                    <p><strong>Desconto:</strong> R$ {venda.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  )}
                  <p><strong>Valor Final:</strong> R$ {venda.valor_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p><strong>Forma de Pagamento:</strong> 
                    <Badge className="ml-2" variant="outline">
                      {venda.forma_pagamento === "pix" ? "PIX" :
                       venda.forma_pagamento === "credito" ? "Crédito" :
                       venda.forma_pagamento === "debito" ? "Débito" :
                       venda.forma_pagamento === "prazo" ? "A Prazo" : venda.forma_pagamento}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            {/* Itens da Venda */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Itens da Venda</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Produto</th>
                      <th className="px-4 py-2 text-right">Quantidade</th>
                      <th className="px-4 py-2 text-right">Preço Unit.</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venda.itens?.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                        <td className="px-4 py-2">{getProdutoNome(item.produto_id)}</td>
                        <td className="px-4 py-2 text-right">{item.quantidade}</td>
                        <td className="px-4 py-2 text-right">
                          R$ {item.preco_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-right">
                          R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observações */}
            {venda.observacoes && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Observações</h3>
                <p className="text-muted-foreground">{venda.observacoes}</p>
              </div>
            )}

            {/* Condições de Pagamento */}
            {venda.condicoes_pagamento && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Condições de Pagamento</h3>
                <p className="text-muted-foreground">{venda.condicoes_pagamento}</p>
              </div>
            )}

            {/* Data de Vencimento para vendas a prazo */}
            {venda.data_vencimento && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Data de Vencimento</h3>
                <p className="text-muted-foreground">
                  {new Date(venda.data_vencimento).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Venda não encontrada</p>
        )}
      </DialogContent>
    </Dialog>
  );
}