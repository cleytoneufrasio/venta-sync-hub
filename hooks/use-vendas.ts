import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ItemVenda {
  id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto?: { nome: string };
}

export interface Venda {
  id: string;
  numero_venda: string;
  data_venda: string;
  cliente_id: string;
  valor_total: number;
  desconto?: number;
  valor_final: number;
  status: 'finalizada' | 'cancelada' | 'pendente';
  forma_pagamento: 'pix' | 'credito' | 'debito' | 'prazo';
  condicoes_pagamento?: string;
  data_vencimento?: string;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  cliente?: { nome: string };
  itens?: ItemVenda[];
}

export function useVendas() {
  return useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          cliente:clientes(nome),
          itens:itens_venda(
            *,
            produto:produtos(nome)
          )
        `)
        .order('data_venda', { ascending: false });
      
      if (error) throw error;
      return data as Venda[];
    },
  });
}

export function useVenda(id: string) {
  return useQuery({
    queryKey: ['venda', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          cliente:clientes(nome),
          itens:itens_venda(
            *,
            produto:produtos(nome)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Venda;
    },
    enabled: !!id,
  });
}

export function useCancelVenda() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (vendaId: string) => {
      // Get venda details first
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select(`
          *,
          itens:itens_venda(*)
        `)
        .eq('id', vendaId)
        .single();

      if (vendaError) throw vendaError;

      // Update venda status to cancelled
      const { error: updateError } = await supabase
        .from('vendas')
        .update({ status: 'cancelada' })
        .eq('id', vendaId);

      if (updateError) throw updateError;

      // Reverse stock for each item
      for (const item of venda.itens) {
        const { data: produto } = await supabase
          .from('produtos')
          .select('estoque_atual')
          .eq('id', item.produto_id)
          .single();
        
        if (produto) {
          await supabase
            .from('produtos')
            .update({ estoque_atual: produto.estoque_atual + item.quantidade })
            .eq('id', item.produto_id);
        }
      }

      // Cancel related contas_receber if exists
      if (venda.forma_pagamento === 'prazo') {
        await supabase
          .from('contas_receber')
          .update({ status: 'cancelada' })
          .eq('venda_id', vendaId);
      }

      return venda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Venda cancelada",
        description: "Venda cancelada e estoque restaurado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar venda",
        variant: "destructive",
      });
    },
  });
}

export function useCreateVenda() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (venda: {
      cliente_id: string;
      desconto?: number;
      observacoes?: string;
      forma_pagamento: 'pix' | 'credito' | 'debito' | 'prazo';
      condicoes_pagamento?: string;
      data_vencimento?: string;
      itens: Omit<ItemVenda, 'id' | 'produto'>[];
    }) => {
      // Generate numero_venda
      const numeroVenda = `V${Date.now()}`;
      
      // Calculate totals
      const valorTotal = venda.itens.reduce((sum, item) => sum + item.subtotal, 0);
      const valorFinal = valorTotal - (venda.desconto || 0);

      // Create venda
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert([{
          numero_venda: numeroVenda,
          cliente_id: venda.cliente_id,
          valor_total: valorTotal,
          desconto: venda.desconto || 0,
          valor_final: valorFinal,
          observacoes: venda.observacoes,
          forma_pagamento: venda.forma_pagamento,
          condicoes_pagamento: venda.condicoes_pagamento,
          data_vencimento: venda.data_vencimento,
          status: 'finalizada' as const,
          data_venda: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user?.id!,
        }])
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Create itens_venda
      const itensWithVendaId = venda.itens.map(item => ({
        ...item,
        venda_id: vendaData.id,
      }));

      const { error: itensError } = await supabase
        .from('itens_venda')
        .insert(itensWithVendaId);

      if (itensError) throw itensError;

      // Create accounts receivable for credit sales
      if (venda.forma_pagamento === 'prazo') {
        const { error: contaReceberError } = await supabase
          .from('contas_receber')
          .insert([{
            cliente_id: venda.cliente_id,
            venda_id: vendaData.id,
            descricao: `Venda ${numeroVenda}`,
            valor: valorFinal,
            data_vencimento: venda.data_vencimento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
            status: 'pendente',
            observacoes: venda.condicoes_pagamento,
            user_id: (await supabase.auth.getUser()).data.user?.id!,
          }]);

        if (contaReceberError) throw contaReceberError;
      }

      // Update product stock
      for (const item of venda.itens) {
        const { data: produto } = await supabase
          .from('produtos')
          .select('estoque_atual')
          .eq('id', item.produto_id)
          .single();
        
        if (produto) {
          await supabase
            .from('produtos')
            .update({ estoque_atual: produto.estoque_atual - item.quantidade })
            .eq('id', item.produto_id);
        }
      }

      return vendaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Venda criada",
        description: "Venda criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar venda",
        variant: "destructive",
      });
    },
  });
}