import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateCliente, useUpdateCliente, Cliente } from "@/hooks/use-clientes";
import { useState, useEffect } from "react";

const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  tipo: z.enum(["pessoa_fisica", "pessoa_juridica"]),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente;
}

export function ClienteForm({ open, onOpenChange, cliente }: ClienteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo: "pessoa_fisica",
    },
  });

  const tipo = watch("tipo");

  useEffect(() => {
    if (cliente) {
      setValue("nome", cliente.nome);
      setValue("email", cliente.email);
      setValue("telefone", cliente.telefone || "");
      setValue("endereco", cliente.endereco || "");
      setValue("cpf_cnpj", cliente.cpf_cnpj || "");
      setValue("tipo", cliente.tipo);
    } else {
      reset({
        nome: "",
        email: "",
        telefone: "",
        endereco: "",
        cpf_cnpj: "",
        tipo: "pessoa_fisica",
      });
    }
  }, [cliente, setValue, reset]);

  const onSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);
    try {
      if (cliente) {
        await updateCliente.mutateAsync({ id: cliente.id, ...data });
      } else {
        await createCliente.mutateAsync({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || "",
          endereco: data.endereco || "",
          cpf_cnpj: data.cpf_cnpj || "",
          tipo: data.tipo,
        });
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {cliente ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register("nome")}
              placeholder="Nome completo ou razão social"
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select onValueChange={(value) => setValue("tipo", value as "pessoa_fisica" | "pessoa_juridica")} value={tipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@exemplo.com (opcional)"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf_cnpj">
              {tipo === "pessoa_fisica" ? "CPF" : "CNPJ"}
            </Label>
            <Input
              id="cpf_cnpj"
              {...register("cpf_cnpj")}
              placeholder={tipo === "pessoa_fisica" ? "000.000.000-00" : "00.000.000/0000-00"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              {...register("telefone")}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              {...register("endereco")}
              placeholder="Endereço completo"
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
              {isSubmitting ? "Salvando..." : cliente ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}