import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmpresa } from '@/hooks/use-empresa';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const empresaSchema = z.object({
  nome: z.string().min(1, 'Nome da empresa é obrigatório'),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

export default function EmpresaSetup() {
  const { user, hasEmpresa, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createEmpresa = useEmpresa();

  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (hasEmpresa) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: EmpresaFormData) => {
    setIsSubmitting(true);
    try {
      await createEmpresa.mutateAsync({
        nome: data.nome,
        cnpj: data.cnpj || undefined,
        email: data.email || undefined,
        telefone: data.telefone || undefined,
        endereco: data.endereco || undefined,
      });
      // Após criar empresa, aguarde e redirecione para dashboard
      navigate('/');
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Configurar Empresa</CardTitle>
          <CardDescription>
            Para continuar, você precisa criar ou associar-se a uma empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                {...form.register('nome')}
                placeholder="Ex: Minha Empresa Ltda"
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                {...form.register('cnpj')}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="contato@empresa.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                {...form.register('telefone')}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                {...form.register('endereco')}
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || createEmpresa.isLoading}
            >
              {isSubmitting || createEmpresa.isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Criando Empresa...
                </>
              ) : (
                'Criar Empresa'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
