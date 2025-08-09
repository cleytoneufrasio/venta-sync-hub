import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateContaPagar, useUpdateContaPagar, ContaPagar } from "@/hooks/use-financeiro";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const contaPagarSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  categoria: z.string().optional(),
  observacoes: z.string().optional(),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

interface ContaPagarFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaPagar;
}

export function ContaPagarForm({ open, onOpenChange, conta }: ContaPagarFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createContaPagar = useCreateContaPagar();
  const updateContaPagar = useUpdateContaPagar();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: {
      data_vencimento: new Date().toISOString().split('T')[0],
      categoria: "despesas",
    },
  });

  const categoria = watch("categoria");

  useEffect(() => {
    if (conta) {
      setValue("descricao", conta.descricao);
      setValue("valor", conta.valor);
      setValue("data_vencimento", conta.data_vencimento);
      setValue("categoria", conta.categoria || "despesas");
      setValue("observacoes", conta.observacoes || "");
    } else {
      reset({
        descricao: "",
        valor: 0,
        data_vencimento: new Date().toISOString().split('T')[0],
        categoria: "despesas",
        observacoes: "",
      });
    }
  }, [conta, setValue, reset]);

  const onSubmit = async (data: ContaPagarFormData) => {
    setIsSubmitting(true);
    try {
      if (conta) {
        // Edição
        await updateContaPagar.mutateAsync({
          id: conta.id,
          conta: {
            descricao: data.descricao,
            valor: data.valor,
            data_vencimento: data.data_vencimento,
            categoria: data.categoria || "despesas",
            observacoes: data.observacoes || "",
            status: conta.status,
          }
        });
      } else {
        // Criação
        await createContaPagar.mutateAsync({
          descricao: data.descricao,
          valor: data.valor,
          data_vencimento: data.data_vencimento,
          categoria: data.categoria || "despesas",
          observacoes: data.observacoes || "",
          status: "pendente",
        });
      }

      toast({
        title: conta ? "Conta atualizada" : "Conta criada",
        description: conta 
          ? "A conta a pagar foi atualizada com sucesso."
          : "A conta a pagar foi criada com sucesso.",
      });

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Erro ao salvar conta a pagar:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conta a pagar. Tente novamente.",
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
            {conta ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              {...register("descricao")}
              placeholder="Descrição da conta a pagar"
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
            <Label htmlFor="categoria">Categoria</Label>
            <Select onValueChange={(value) => setValue("categoria", value)} value={categoria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estoque">Estoque</SelectItem>
                <SelectItem value="despesas">Despesas</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="fornecedores">Fornecedores</SelectItem>
                <SelectItem value="impostos">Impostos</SelectItem>
                <SelectItem value="aluguel">Aluguel</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
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