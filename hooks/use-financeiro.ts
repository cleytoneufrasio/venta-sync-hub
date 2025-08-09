import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContaReceber {
  id: string;
  cliente_id: string;
  venda_id?: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'paga' | 'vencida';
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  cliente?: { nome: string };
}

export interface ContaPagar {
  id: string;
  fornecedor_id?: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'paga' | 'vencida';
  categoria?: string;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  fornecedor?: { nome: string };
}

export function useContasReceber() {
  return useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          *,
          cliente:clientes(nome)
        `)
        .order('data_vencimento');
      
      if (error) throw error;
      return data as ContaReceber[];
    },
  });
}

export function useContasPagar() {
  return useQuery({
    queryKey: ['contas-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          *,
          fornecedor:fornecedores(nome)
        `)
        .order('data_vencimento');
      
      if (error) throw error;
      return data as ContaPagar[];
    },
  });
}

export function useCreateContaReceber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conta: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('contas_receber')
        .insert([{ ...conta, user_id: (await supabase.auth.getUser()).data.user?.id! }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({
        title: "Conta a receber criada",
        description: "Conta a receber criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta a receber",
        variant: "destructive",
      });
    },
  });
}

export function useCreateContaPagar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conta: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at' | 'fornecedor' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .insert([{ ...conta, user_id: (await supabase.auth.getUser()).data.user?.id! }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Conta a pagar criada",
        description: "Conta a pagar criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta a pagar",
        variant: "destructive",
      });
    },
  });
}

export function usePayContaReceber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('contas_receber')
        .update({
          status: 'paga',
          data_pagamento: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Pagamento registrado",
        description: "Conta marcada como paga!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar pagamento",
        variant: "destructive",
      });
    },
  });
}

export function usePayContaPagar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .update({
          status: 'paga',
          data_pagamento: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Pagamento registrado",
        description: "Conta marcada como paga!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar pagamento",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateContaReceber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, conta }: { id: string; conta: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'user_id'> }) => {
      const { data, error } = await supabase
        .from('contas_receber')
        .update(conta)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({
        title: "Conta atualizada",
        description: "Conta a receber atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar conta a receber",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateContaPagar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, conta }: { id: string; conta: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at' | 'fornecedor' | 'user_id'> }) => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .update(conta)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Conta atualizada",
        description: "Conta a pagar atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar conta a pagar",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteContaReceber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contas_receber')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Conta excluída",
        description: "Conta a receber excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir conta a receber",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteContaPagar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Conta excluída",
        description: "Conta a pagar excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir conta a pagar",
        variant: "destructive",
      });
    },
  });
}

// Aliases for better naming
export const useMarcarContaRecebida = usePayContaReceber;
export const useMarcarContaPaga = usePayContaPagar;