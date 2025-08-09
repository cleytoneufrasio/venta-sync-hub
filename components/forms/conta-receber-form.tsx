import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateContaReceber, useUpdateContaReceber, ContaReceber } from "@/hooks/use-financeiro";
import { useClientes } from "@/hooks/use-clientes";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const contaReceberSchema = z.object({
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  observacoes: z.string().optional(),
});

type ContaReceberFormData = z.infer<typeof contaReceberSchema>;

interface ContaReceberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaReceber;
}

export function ContaReceberForm({ open, onOpenChange, conta }: ContaReceberFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createContaReceber = useCreateContaReceber();
  const updateContaReceber = useUpdateContaReceber();
  const { data: clientes } = useClientes();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ContaReceberFormData>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: {
      data_vencimento: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (conta) {
      setValue("cliente_id", conta.cliente_id);
      setValue("descricao", conta.descricao);
      setValue("valor", conta.valor);
      setValue("data_vencimento", conta.data_vencimento);
      setValue("observacoes", conta.observacoes || "");
    } else {
      reset({
        cliente_id: "",
        descricao: "",
        valor: 0,
        data_vencimento: new Date().toISOString().split('T')[0],
        observacoes: "",
      });
    }
  }, [conta, setValue, reset]);

  const onSubmit = async (data: ContaReceberFormData) => {
    setIsSubmitting(true);
    try {
      if (conta) {
        // Edição
        await updateContaReceber.mutateAsync({
          id: conta.id,
          conta: {
            cliente_id: data.cliente_id,
            descricao: data.descricao,
            valor: data.valor,
            data_vencimento: data.data_vencimento,
            observacoes: data.observacoes || "",
            status: conta.status,
          }
        });
      } else {
        // Criação
        await createContaReceber.mutateAsync({
          cliente_id: data.cliente_id,
          descricao: data.descricao,
          valor: data.valor,
          data_vencimento: data.data_vencimento,
          observacoes: data.observacoes || "",
          status: "pendente",
        });
      }

      toast({
        title: conta ? "Conta atualizada" : "Conta criada",
        description: conta 
          ? "A conta a receber foi atualizada com sucesso."
          : "A conta a receber foi criada com sucesso.",
      });

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Erro ao salvar conta a receber:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conta a receber. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {conta ? "Editar Conta a Receber" : "Nova Conta a Receber"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              {...register("descricao")}
              placeholder="Descrição da conta a receber"
            />
            {errors.descricao && (
              <p className="text-sm text-destructive">{errors.descricao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                {...register("valor", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.valor && (
                <p className="text-sm text-destructive">{errors.valor.message}</p>
              )}
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register("observacoes")}
              placeholder="Observações sobre a conta"
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
              {isSubmitting ? "Salvando..." : conta ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}