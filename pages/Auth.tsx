import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Building2, Mail, Lock, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

const empresaSignupSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  empresaNome: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  empresaCnpj: z.string().optional(),
  empresaEmail: z.string().email('Email inválido').optional().or(z.literal("")),
  empresaTelefone: z.string().optional(),
  empresaEndereco: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type EmpresaSignupFormData = z.infer<typeof empresaSignupSchema>;

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { signIn, signUp, signUpWithEmpresa, user, hasEmpresa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    console.log('Auth page: Verificando usuário...', !!user, 'From:', from);
    if (user) {
      console.log('Auth page: Usuário logado, redirecionando para:', from);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const empresaSignupForm = useForm<EmpresaSignupFormData>({
    resolver: zodResolver(empresaSignupSchema),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      confirmPassword: '',
      empresaNome: '',
      empresaCnpj: '',
      empresaEmail: '',
      empresaTelefone: '',
      empresaEndereco: '',
    },
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    
    if (!error) {
      navigate(from, { replace: true });
    }
  };

  const onEmpresaSignup = async (data: EmpresaSignupFormData) => {
    setIsLoading(true);
    const { error } = await signUpWithEmpresa({
      email: data.email,
      password: data.password,
      nome: data.nome,
      empresa: {
        nome: data.empresaNome,
        cnpj: data.empresaCnpj,
        email: data.empresaEmail,
        telefone: data.empresaTelefone,
        endereco: data.empresaEndereco,
      },
    });
    setIsLoading(false);
    
    if (!error) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Sistema de Gestão</h1>
          <p className="text-muted-foreground">
            Gerencie seu negócio de forma inteligente
          </p>
        </div>

        {/* Auth Forms */}
        <Card className="shadow-elevated">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="space-y-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 mt-0">
                <div className="space-y-2 text-center">
                  <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
                  <CardDescription>
                    Digite suas credenciais para acessar sua conta
                  </CardDescription>
                </div>

                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...loginForm.register('password')}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4 mt-0">
                <div className="space-y-2 text-center">
                  <CardTitle className="text-xl">Criar nova conta</CardTitle>
                  <CardDescription>
                    Cadastre-se e crie sua empresa
                  </CardDescription>
                </div>

                <form onSubmit={empresaSignupForm.handleSubmit(onEmpresaSignup)} className="space-y-4">
                  {/* Dados do usuário */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm text-muted-foreground">Seus dados</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-nome">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-nome"
                          type="text"
                          placeholder="Seu nome completo"
                          className="pl-10"
                          {...empresaSignupForm.register('nome')}
                        />
                      </div>
                      {empresaSignupForm.formState.errors.nome && (
                        <p className="text-sm text-destructive">
                          {empresaSignupForm.formState.errors.nome.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          {...empresaSignupForm.register('email')}
                        />
                      </div>
                      {empresaSignupForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {empresaSignupForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          {...empresaSignupForm.register('password')}
                        />
                      </div>
                      {empresaSignupForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {empresaSignupForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          {...empresaSignupForm.register('confirmPassword')}
                        />
                      </div>
                      {empresaSignupForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {empresaSignupForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dados da empresa */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-medium text-sm text-muted-foreground">Dados da empresa</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="empresa-nome">Nome da empresa *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="empresa-nome"
                          type="text"
                          placeholder="Nome da sua empresa"
                          className="pl-10"
                          {...empresaSignupForm.register('empresaNome')}
                        />
                      </div>
                      {empresaSignupForm.formState.errors.empresaNome && (
                        <p className="text-sm text-destructive">
                          {empresaSignupForm.formState.errors.empresaNome.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="empresa-cnpj">CNPJ</Label>
                        <Input
                          id="empresa-cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          {...empresaSignupForm.register('empresaCnpj')}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="empresa-telefone">Telefone</Label>
                        <Input
                          id="empresa-telefone"
                          type="text"
                          placeholder="(00) 00000-0000"
                          {...empresaSignupForm.register('empresaTelefone')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="empresa-email">Email da empresa</Label>
                      <Input
                        id="empresa-email"
                        type="email"
                        placeholder="contato@empresa.com"
                        {...empresaSignupForm.register('empresaEmail')}
                      />
                      {empresaSignupForm.formState.errors.empresaEmail && (
                        <p className="text-sm text-destructive">
                          {empresaSignupForm.formState.errors.empresaEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="empresa-endereco">Endereço</Label>
                      <Input
                        id="empresa-endereco"
                        type="text"
                        placeholder="Endereço completo da empresa"
                        {...empresaSignupForm.register('empresaEndereco')}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Criar conta e empresa'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Sistema de gestão empresarial completo</p>
        </div>
      </div>
    </div>
  );
}