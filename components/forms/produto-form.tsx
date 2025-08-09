import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateProduto, useUpdateProduto, Produto } from "@/hooks/use-produtos";
import { useState, useEffect } from "react";

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  codigo: z.string().optional(),
  preco_custo: z.number().min(0, "Preço de custo deve ser positivo"),
  preco_venda: z.number().min(0, "Preço de venda deve ser positivo"),
  estoque_atual: z.number().int().min(0, "Estoque deve ser positivo"),
  estoque_minimo: z.number().int().min(0, "Estoque mínimo deve ser positivo"),
  unidade: z.string().optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: Produto;
}

export function ProdutoForm({ open, onOpenChange, produto }: ProdutoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      preco_custo: 0,
      preco_venda: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      unidade: "UN",
    },
  });

  useEffect(() => {
    if (produto) {
      setValue("nome", produto.nome);
      setValue("descricao", produto.descricao || "");
      setValue("codigo", produto.codigo || "");
      setValue("preco_custo", produto.preco_custo);
      setValue("preco_venda", produto.preco_venda);
      setValue("estoque_atual", produto.estoque_atual);
      setValue("estoque_minimo", produto.estoque_minimo || 0);
      setValue("unidade", produto.unidade || "UN");
    } else {
      reset({
        nome: "",
        descricao: "",
        codigo: "",
        preco_custo: 0,
        preco_venda: 0,
        estoque_atual: 0,
        estoque_minimo: 0,
        unidade: "UN",
      });
    }
  }, [produto, setValue, reset]);

  const onSubmit = async (data: ProdutoFormData) => {
    setIsSubmitting(true);
    try {
      if (produto) {
        await updateProduto.mutateAsync({ id: produto.id, ...data });
      } else {
        await createProduto.mutateAsync({
          nome: data.nome,
          descricao: data.descricao || "",
          codigo: data.codigo || "",
          preco_custo: data.preco_custo,
          preco_venda: data.preco_venda,
          estoque_atual: data.estoque_atual,
          estoque_minimo: data.estoque_minimo,
          unidade: data.unidade || "UN",
          ativo: true,
        });
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {produto ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...register("nome")}
                placeholder="Nome do produto"
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                {...register("codigo")}
                placeholder="Código do produto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register("descricao")}
              placeholder="Descrição do produto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_custo">Preço de Custo *</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                {...register("preco_custo", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.preco_custo && (
                <p className="text-sm text-destructive">{errors.preco_custo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de Venda *</Label>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                {...register("preco_venda", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.preco_venda && (
                <p className="text-sm text-destructive">{errors.preco_venda.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                {...register("unidade")}
                placeholder="UN"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estoque_atual">Estoque Atual *</Label>
              <Input
                id="estoque_atual"
                type="number"
                {...register("estoque_atual", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.estoque_atual && (
                <p className="text-sm text-destructive">{errors.estoque_atual.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoque_minimo">Estoque Mínimo *</Label>
              <Input
                id="estoque_minimo"
                type="number"
                {...register("estoque_minimo", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.estoque_minimo && (
                <p className="text-sm text-destructive">{errors.estoque_minimo.message}</p>
              )}
            </div>
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
              {isSubmitting ? "Salvando..." : produto ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}