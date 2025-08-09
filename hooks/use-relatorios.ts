import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProdutoMaisVendido {
  id: string;
  nome: string;
  quantidadeVendida: number;
  valorTotal: number;
  margemLucro: number;
}

interface DemonstrativoFinanceiro {
  periodo: string;
  receitas: number;
  despesas: number;
  lucroLiquido: number;
  margemLucro: number;
}

interface MargemLucroProduto {
  id: string;
  nome: string;
  precoCusto: number;
  precoVenda: number;
  margemPercentual: number;
  margemValor: number;
}

interface CrescimentoMensal {
  mes: string;
  vendas: number;
  faturamento: number;
  crescimentoVendas: number;
  crescimentoFaturamento: number;
}

export function useProdutosMaisVendidos(periodo: { inicio: string; fim: string }) {
  return useQuery({
    queryKey: ['produtos-mais-vendidos', periodo],
    queryFn: async (): Promise<ProdutoMaisVendido[]> => {
      const { data, error } = await supabase
        .from('itens_venda')
        .select(`
          quantidade,
          preco_unitario,
          subtotal,
          produto:produtos(id, nome, preco_custo, preco_venda),
          venda:vendas!inner(data_venda, status)
        `)
        .gte('venda.data_venda', periodo.inicio)
        .lte('venda.data_venda', periodo.fim)
        .eq('venda.status', 'finalizada');

      if (error) throw error;

      const produtosMap = new Map<string, ProdutoMaisVendido>();
      
      data?.forEach((item: any) => {
        const produto = item.produto;
        const existingProduto = produtosMap.get(produto.id);
        
        const margemUnitaria = produto.preco_venda - produto.preco_custo;
        const margemTotal = margemUnitaria * item.quantidade;
        
        if (existingProduto) {
          existingProduto.quantidadeVendida += item.quantidade;
          existingProduto.valorTotal += item.subtotal;
          existingProduto.margemLucro += margemTotal;
        } else {
          produtosMap.set(produto.id, {
            id: produto.id,
            nome: produto.nome,
            quantidadeVendida: item.quantidade,
            valorTotal: item.subtotal,
            margemLucro: margemTotal,
          });
        }
      });

      return Array.from(produtosMap.values())
        .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);
    },
    enabled: !!periodo.inicio && !!periodo.fim,
  });
}

export function useDemonstrativoFinanceiro(periodo: { inicio: string; fim: string }) {
  return useQuery({
    queryKey: ['demonstrativo-financeiro', periodo],
    queryFn: async (): Promise<DemonstrativoFinanceiro> => {
      // Buscar receitas (vendas finalizadas)
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('valor_final')
        .gte('data_venda', periodo.inicio)
        .lte('data_venda', periodo.fim)
        .eq('status', 'finalizada');

      if (vendasError) throw vendasError;

      // Buscar despesas (contas pagas)
      const { data: contasPagar, error: contasError } = await supabase
        .from('contas_pagar')
        .select('valor')
        .gte('data_pagamento', periodo.inicio)
        .lte('data_pagamento', periodo.fim)
        .eq('status', 'paga');

      if (contasError) throw contasError;

      const receitas = vendas?.reduce((sum, venda) => sum + venda.valor_final, 0) || 0;
      const despesas = contasPagar?.reduce((sum, conta) => sum + conta.valor, 0) || 0;
      const lucroLiquido = receitas - despesas;
      const margemLucro = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0;

      return {
        periodo: `${periodo.inicio} a ${periodo.fim}`,
        receitas,
        despesas,
        lucroLiquido,
        margemLucro,
      };
    },
    enabled: !!periodo.inicio && !!periodo.fim,
  });
}

export function useMargemLucroProdutos() {
  return useQuery({
    queryKey: ['margem-lucro-produtos'],
    queryFn: async (): Promise<MargemLucroProduto[]> => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, preco_custo, preco_venda')
        .eq('ativo', true);

      if (error) throw error;

      return data?.map(produto => {
        const margemValor = produto.preco_venda - produto.preco_custo;
        const margemPercentual = produto.preco_custo > 0 
          ? (margemValor / produto.preco_custo) * 100 
          : 0;

        return {
          id: produto.id,
          nome: produto.nome,
          precoCusto: produto.preco_custo,
          precoVenda: produto.preco_venda,
          margemPercentual,
          margemValor,
        };
      }).sort((a, b) => b.margemPercentual - a.margemPercentual) || [];
    },
  });
}

export function useCrescimentoMensal() {
  return useQuery({
    queryKey: ['crescimento-mensal'],
    queryFn: async (): Promise<CrescimentoMensal[]> => {
      const mesesAtras = 6;
      const dados: CrescimentoMensal[] = [];
      
      for (let i = mesesAtras; i >= 0; i--) {
        const dataFim = new Date();
        dataFim.setMonth(dataFim.getMonth() - i);
        const dataInicio = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1);
        const ultimoDia = new Date(dataFim.getFullYear(), dataFim.getMonth() + 1, 0);
        
        const { data: vendas } = await supabase
          .from('vendas')
          .select('valor_final')
          .gte('data_venda', dataInicio.toISOString())
          .lte('data_venda', ultimoDia.toISOString())
          .eq('status', 'finalizada');

        const numeroVendas = vendas?.length || 0;
        const faturamento = vendas?.reduce((sum, v) => sum + v.valor_final, 0) || 0;

        // Calcular crescimento (comparar com mês anterior)
        let crescimentoVendas = 0;
        let crescimentoFaturamento = 0;
        
        if (dados.length > 0) {
          const mesAnterior = dados[dados.length - 1];
          crescimentoVendas = mesAnterior.vendas > 0 
            ? ((numeroVendas - mesAnterior.vendas) / mesAnterior.vendas) * 100 
            : 0;
          crescimentoFaturamento = mesAnterior.faturamento > 0 
            ? ((faturamento - mesAnterior.faturamento) / mesAnterior.faturamento) * 100 
            : 0;
        }

        dados.push({
          mes: dataInicio.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          vendas: numeroVendas,
          faturamento,
          crescimentoVendas,
          crescimentoFaturamento,
        });
      }

      return dados;
    },
  });
}