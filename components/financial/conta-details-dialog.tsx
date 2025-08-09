import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, UserIcon, DollarSignIcon, FileTextIcon, TagIcon, ClockIcon } from "lucide-react";
import { ContaReceber, ContaPagar } from "@/hooks/use-financeiro";

interface ContaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaReceber | ContaPagar | null;
  type: 'receber' | 'pagar';
  clienteNome?: string;
  fornecedorNome?: string;
}

export function ContaDetailsDialog({ 
  open, 
  onOpenChange, 
  conta, 
  type, 
  clienteNome, 
  fornecedorNome 
}: ContaDetailsDialogProps) {
  if (!conta) return null;

  const calcularDiasVencimento = (dataVencimento: string, status: string) => {
    if (status === "paga") return null;
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const dias = calcularDiasVencimento(conta.data_vencimento, conta.status);
  const isContaPagar = type === 'pagar';
  const nomeEntidade = isContaPagar ? fornecedorNome : clienteNome;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Detalhes da Conta {isContaPagar ? 'a Pagar' : 'a Receber'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <Badge variant={conta.status === 'paga' ? 'default' : 'secondary'}>
              {conta.status === 'paga' ? 'Paga' : 'Em aberto'}
            </Badge>
          </div>

          <Separator />

          {/* Informações principais */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileTextIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Descrição</p>
                <p className="text-sm text-muted-foreground">{conta.descricao}</p>
              </div>
            </div>

            {nomeEntidade && (
              <div className="flex items-start gap-3">
                <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{isContaPagar ? 'Fornecedor' : 'Cliente'}</p>
                  <p className="text-sm text-muted-foreground">{nomeEntidade}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSignIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Valor</p>
                <p className="text-sm font-semibold text-primary">
                  R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Data de Vencimento</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {conta.data_pagamento && (
              <div className="flex items-start gap-3">
                <ClockIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Data de Pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(conta.data_pagamento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )}

            {isContaPagar && 'categoria' in conta && conta.categoria && (
              <div className="flex items-start gap-3">
                <TagIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Categoria</p>
                  <p className="text-sm text-muted-foreground">{conta.categoria}</p>
                </div>
              </div>
            )}

            {conta.observacoes && (
              <div className="flex items-start gap-3">
                <FileTextIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Observações</p>
                  <p className="text-sm text-muted-foreground">{conta.observacoes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Situação */}
          {conta.status !== 'paga' && dias !== null && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Situação</p>
                {dias < 0 ? (
                  <p className="text-sm text-destructive font-medium">
                    {Math.abs(dias)} dias em atraso
                  </p>
                ) : dias <= 3 ? (
                  <p className="text-sm text-warning font-medium">
                    Vence em {dias} dias
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Vence em {dias} dias
                  </p>
                )}
              </div>
            </>
          )}

          {/* Informações técnicas */}
          <Separator />
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Criado em:</span>
              <span>{new Date(conta.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Atualizado em:</span>
              <span>{new Date(conta.updated_at).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}