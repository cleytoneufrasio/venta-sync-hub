import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useEffect } from 'react';

// ... (seus tipos e constantes permanecem os mesmos) ...
export interface MovimentacaoFinanceira {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  origem: 'venda' | 'conta_receber' | 'conta_pagar';
  cliente_fornecedor?: string;
}

export interface ResumoFluxoCaixa {
  entradas: number;
  saidas: number;
  saldo: number;
  movimentacoes: MovimentacaoFinanceira[];
}

export interface PeriodoFluxo {
  label: string;
  value: string;
  dataInicio: Date;
  dataFim: Date;
}

export const PERIODOS_FLUXO: PeriodoFluxo[] = [
  {
    label: 'Hoje',
    value: 'hoje',
    dataInicio: startOfDay(new Date()),
    dataFim: endOfDay(new Date()),
  },
  {
    label: 'Últimos 7 dias',
    value: '7dias',
    dataInicio: startOfDay(subDays(new Date(), 6)),
    dataFim: endOfDay(new Date()),
  },
  {
    label: 'Mês atual',
    value: 'mes',
    dataInicio: startOfMonth(new Date()),
    dataFim: endOfMonth(new Date()),
  },
];

export function useFluxoCaixa(dataInicio: Date, dataFim: Date) {
  const queryClient = useQueryClient();
  const queryKey = ['fluxo-caixa', format(dataInicio, 'yyyy-MM-dd'), format(dataFim, 'yyyy-MM-dd')];

  useEffect(() => {
    const tablesToListen = ['vendas', 'contas_receber', 'contas_pagar'];
    
    const channel = supabase.channel('fluxo_caixa_channel');
    
    tablesToListen.forEach(table => {
      channel.on(
        'postgres_changes',  
        { event: '*', schema: 'public', table: table },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ResumoFluxoCaixa> => {
      const dataInicioStr = format(dataInicio, 'yyyy-MM-dd');
      const dataFimStr = format(dataFim, 'yyyy-MM-dd');

      // Buscar vendas à vista (entradas)
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select(`
          id,
          numero_venda,
          data_venda,
          valor_final,
          forma_pagamento,
          cliente:clientes(nome)
        `)
        .gte('data_venda', dataInicioStr)
        .lte('data_venda', dataFimStr)
        .neq('forma_pagamento', 'prazo')
        .eq('status', 'finalizada')
        .neq('status', 'cancelada'); // <-- Adicionamos esta linha

      if (vendasError) throw vendasError;

      // Buscar contas recebidas (entradas)
      const { data: contasRecebidas, error: contasRecebidasError } = await supabase
        .from('contas_receber')
        .select(`
          id,
          descricao,
          valor,
          data_pagamento,
          cliente:clientes(nome)
        `)
        .gte('data_pagamento', dataInicioStr)
        .lte('data_pagamento', dataFimStr)
        .eq('status', 'paga');

      if (contasRecebidasError) throw contasRecebidasError;

      // Buscar contas pagas (saídas)
      const { data: contasPagas, error: contasPagasError } = await supabase
        .from('contas_pagar')
        .select(`
          id,
          descricao,
          valor,
          data_pagamento,
          categoria,
          fornecedor:fornecedores(nome)
        `)
        .gte('data_pagamento', dataInicioStr)
        .lte('data_pagamento', dataFimStr)
        .eq('status', 'paga');

      if (contasPagasError) throw contasPagasError;

      // Consolidar movimentações
      const movimentacoes: MovimentacaoFinanceira[] = [];

      // Adicionar vendas à vista
      vendas?.forEach(venda => {
        movimentacoes.push({
          id: venda.id,
          data: venda.data_venda,
          descricao: `Venda ${venda.numero_venda}`,
          valor: venda.valor_final,
          tipo: 'entrada',
          categoria: `Venda ${venda.forma_pagamento}`,
          origem: 'venda',
          cliente_fornecedor: venda.cliente?.nome || 'Cliente não informado',
        });
      });

      // Adicionar contas recebidas
      contasRecebidas?.forEach(conta => {
        movimentacoes.push({
          id: conta.id,
          data: conta.data_pagamento!,
          descricao: conta.descricao,
          valor: conta.valor,
          tipo: 'entrada',
          categoria: 'Recebimento',
          origem: 'conta_receber',
          cliente_fornecedor: conta.cliente?.nome || 'Cliente não informado',
        });
      });

      // Adicionar contas pagas
      contasPagas?.forEach(conta => {
        movimentacoes.push({
          id: conta.id,
          data: conta.data_pagamento!,
          descricao: conta.descricao,
          valor: conta.valor,
          tipo: 'saida',
          categoria: conta.categoria || 'Despesa',
          origem: 'conta_pagar',
          cliente_fornecedor: conta.fornecedor?.nome || 'Fornecedor não informado',
        });
      });

      // Ordenar por data (mais recente primeiro)
      movimentacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      // Calcular totais
      const entradas = movimentacoes
        .filter(m => m.tipo === 'entrada')
        .reduce((sum, m) => sum + m.valor, 0);

      const saidas = movimentacoes
        .filter(m => m.tipo === 'saida')
        .reduce((sum, m) => sum + m.valor, 0);

      const saldo = entradas - saidas;

      return {
        entradas,
        saidas,
        saldo,
        movimentacoes,
      };
    },
  });
}