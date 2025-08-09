import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateVenda, Venda } from "@/hooks/use-vendas";
import { useClientes } from "@/hooks/use-clientes";
import { useProdutos } from "@/hooks/use-produtos";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const itemVendaSchema = z.object({
  produto_id: z.string().min(1, "Produto é obrigatório"),
  quantidade: z.number().int().min(1, "Quantidade deve ser maior que 0"),
  preco_unitario: z.number().min(0, "Preço deve ser positivo"),
  subtotal: z.number().min(0, "Subtotal deve ser positivo"),
});

const vendaSchema = z.object({
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  data_venda: z.string().min(1, "Data da venda é obrigatória"),
  desconto: z.number().min(0, "Desconto deve ser positivo").optional(),
  forma_pagamento: z.enum(['pix', 'credito', 'debito', 'prazo'], {
    required_error: "Forma de pagamento é obrigatória",
  }),
  condicoes_pagamento: z.string().optional(),
  data_vencimento: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(itemVendaSchema).min(1, "Pelo menos um item é obrigatório"),
}).refine((data) => {
  if (data.forma_pagamento === 'prazo' && !data.data_vencimento) {
    return false;
  }
  return true;
}, {
  message: "Data de vencimento é obrigatória para vendas a prazo",
  path: ["data_vencimento"],
});

type VendaFormData = z.infer<typeof vendaSchema>;

interface VendaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendaForm({ open, onOpenChange }: VendaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createVenda = useCreateVenda();
  const { data: clientes } = useClientes();
  const { data: produtos } = useProdutos();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<VendaFormData>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      data_venda: new Date().toISOString().split('T')[0],
      desconto: 0,
      forma_pagamento: 'pix' as const,
      itens: [{ produto_id: "", quantidade: 1, preco_unitario: 0, subtotal: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  const watchedItens = watch("itens");
  const watchedDesconto = watch("desconto") || 0;
  const watchedFormaPagamento = watch("forma_pagamento");

  const calculateTotal = () => {
    const subtotal = watchedItens?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
    return subtotal - watchedDesconto;
  };

  const handleProdutoChange = (index: number, produtoId: string) => {
    const produto = produtos?.find(p => p.id === produtoId);
    if (produto) {
      setValue(`itens.${index}.produto_id`, produtoId);
      setValue(`itens.${index}.preco_unitario`, produto.preco_venda);
      updateSubtotal(index, watchedItens[index]?.quantidade || 1, produto.preco_venda);
    }
  };

  const handleQuantidadeChange = (index: number, quantidade: number) => {
    setValue(`itens.${index}.quantidade`, quantidade);
    updateSubtotal(index, quantidade, watchedItens[index]?.preco_unitario || 0);
  };

  const updateSubtotal = (index: number, quantidade: number, precoUnitario: number) => {
    const subtotal = quantidade * precoUnitario;
    setValue(`itens.${index}.subtotal`, subtotal);
  };

  const onSubmit = async (data: VendaFormData) => {
    setIsSubmitting(true);
    try {
      const valorTotal = data.itens.reduce((sum, item) => sum + item.subtotal, 0);
      const valorFinal = valorTotal - (data.desconto || 0);

        const itensValidos = data.itens.filter(item => 
          item.produto_id && 
          item.quantidade > 0 && 
          item.preco_unitario > 0
        );

        await createVenda.mutateAsync({
          cliente_id: data.cliente_id,
          desconto: data.desconto || 0,
          observacoes: data.observacoes || "",
          forma_pagamento: data.forma_pagamento,
          condicoes_pagamento: data.condicoes_pagamento,
          data_vencimento: data.data_vencimento,
          itens: itensValidos.map(item => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal
          })),
        });

      toast({
        title: "Venda criada",
        description: "A venda foi criada com sucesso.",
      });

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar venda. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <Select onValueChange={(value) => setValue("cliente_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cliente_id && (
                <p className="text-sm text-destructive">{errors.cliente_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_venda">Data da Venda *</Label>
              <Input
                id="data_venda"
                type="date"
                {...register("data_venda")}
              />
              {errors.data_venda && (
                <p className="text-sm text-destructive">{errors.data_venda.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Itens da Venda</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ produto_id: "", quantidade: 1, preco_unitario: 0, subtotal: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Item {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Produto *</Label>
                    <Select onValueChange={(value) => handleProdutoChange(index, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos?.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register(`itens.${index}.quantidade`, { 
                        valueAsNumber: true,
                        onChange: (e) => handleQuantidadeChange(index, parseInt(e.target.value) || 1)
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preço Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`itens.${index}.preco_unitario`, { valueAsNumber: true })}
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtotal</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`itens.${index}.subtotal`, { valueAsNumber: true })}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ))}

            {errors.itens && (
              <p className="text-sm text-destructive">{errors.itens.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto (R$)</Label>
              <Input
                id="desconto"
                type="number"
                step="0.01"
                {...register("desconto", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Total da Venda</Label>
              <div className="p-2 bg-muted rounded-md">
                <span className="text-lg font-bold">
                  R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Forma de Pagamento *</Label>
              <RadioGroup
                value={watchedFormaPagamento}
                onValueChange={(value) => setValue("forma_pagamento", value as any)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix">PIX</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credito" id="credito" />
                  <Label htmlFor="credito">Cartão de Crédito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debito" id="debito" />
                  <Label htmlFor="debito">Cartão de Débito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prazo" id="prazo" />
                  <Label htmlFor="prazo">A Prazo</Label>
                </div>
              </RadioGroup>
              {errors.forma_pagamento && (
                <p className="text-sm text-destructive">{errors.forma_pagamento.message}</p>
              )}
            </div>

            {watchedFormaPagamento === 'prazo' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                  <Input
                    id="data_vencimento"
                    type="date"
                    {...register("data_vencimento")}
                  />
                  {errors.data_vencimento && (
                    <p className="text-sm text-destructive">{errors.data_vencimento.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
                  <Input
                    id="condicoes_pagamento"
                    {...register("condicoes_pagamento")}
                    placeholder="Ex: 30 dias"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register("observacoes")}
              placeholder="Observações sobre a venda"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Venda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}