import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SalesData {
  date: string;
  vendas: number;
  receita: number;
}

interface ContaAberta {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  tipo: 'receber' | 'pagar';
  dias_vencimento: number;
}

export interface DashboardStats {
  totalVendas: number;
  faturamentoMensal: number;
  clientesAtivos: number;
  produtosBaixoEstoque: number;
  vendasRecentes: Array<{
    id: string;
    numero_venda: string;
    data_venda: string;
    cliente: { nome: string };
    valor_final: number;
    status: string;
  }>;
  alertasEstoque: Array<{
    id: string;
    nome: string;
    estoque_atual: number;
    estoque_minimo: number;
  }>;
  salesChart: SalesData[];
  contasAbertas: ContaAberta[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('Iniciando carregamento das estatísticas do dashboard...');
      
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      try {
        // Total de vendas no mês
        console.log('Buscando vendas do mês...');
        const { data: vendas, error: vendasError } = await supabase
          .from('vendas')
          .select('valor_final')
          .gte('data_venda', inicioMes.toISOString())
          .eq('status', 'finalizada');
        
        if (vendasError) {
          console.error('Erro ao buscar vendas:', vendasError);
          throw vendasError;
        }
        console.log('Vendas encontradas:', vendas?.length || 0);

        // Faturamento mensal
        const faturamentoMensal = vendas?.reduce((sum, venda) => sum + venda.valor_final, 0) || 0;
        const totalVendas = vendas?.length || 0;

        // Clientes ativos (que fizeram compras nos últimos 3 meses)
        console.log('Buscando clientes ativos...');
        const tresMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
        const { data: clientesAtivos, error: clientesError } = await supabase
          .from('vendas')
          .select('cliente_id')
          .gte('data_venda', tresMesesAtras.toISOString())
          .eq('status', 'finalizada');
        
        if (clientesError) {
          console.error('Erro ao buscar clientes ativos:', clientesError);
          throw clientesError;
        }
        console.log('Clientes ativos encontrados:', clientesAtivos?.length || 0);

        const clientesUnicos = new Set(clientesAtivos?.map(v => v.cliente_id)).size;

        // Produtos com baixo estoque
        console.log('Buscando produtos com baixo estoque...');
        const { data: produtosBaixoEstoque, error: estoqueError } = await supabase
          .from('produtos')
          .select('id, nome, estoque_atual, estoque_minimo')
          .not('estoque_minimo', 'is', null)
          .gte('estoque_minimo', 0)
          .eq('ativo', true);
        
        if (estoqueError) {
          console.error('Erro ao buscar produtos com baixo estoque:', estoqueError);
          throw estoqueError;
        }
        
        // Filtrar produtos com estoque abaixo do mínimo no frontend
        const produtosComBaixoEstoque = produtosBaixoEstoque?.filter(produto => 
          produto.estoque_atual <= produto.estoque_minimo && 
          typeof produto.estoque_minimo === 'number'
        ) || [];
        
        console.log('Produtos com baixo estoque encontrados:', produtosComBaixoEstoque?.length || 0);

        // Vendas recentes (últimas 5) - apenas finalizadas
        console.log('Buscando vendas recentes...');
        const { data: vendasRecentes, error: recentesError } = await supabase
          .from('vendas')
          .select(`
            id,
            numero_venda,
            data_venda,
            valor_final,
            status,
            cliente:clientes(nome)
          `)
          .eq('status', 'finalizada')
          .order('data_venda', { ascending: false })
          .limit(5);
        
        if (recentesError) {
          console.error('Erro ao buscar vendas recentes:', recentesError);
          throw recentesError;
        }
        console.log('Vendas recentes encontradas:', vendasRecentes?.length || 0);

        // Dados do gráfico de vendas dos últimos 7 dias
        console.log('Buscando dados do gráfico...');
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
        
        const salesChart: SalesData[] = [];
        for (let i = 0; i < 7; i++) {
          const data = new Date(seteDiasAtras);
          data.setDate(data.getDate() + i);
          const dataFormatada = data.toISOString().split('T')[0];
          
          const { data: vendasDia } = await supabase
            .from('vendas')
            .select('valor_final')
            .eq('status', 'finalizada')
            .gte('data_venda', `${dataFormatada}T00:00:00`)
            .lt('data_venda', `${dataFormatada}T23:59:59`);
          
          const quantidadeVendas = vendasDia?.length || 0;
          const receitaDia = vendasDia?.reduce((sum, v) => sum + v.valor_final, 0) || 0;
          
          salesChart.push({
            date: data.getDate().toString().padStart(2, '0'),
            vendas: quantidadeVendas,
            receita: receitaDia,
          });
        }

        // Contas em aberto
        console.log('Buscando contas em aberto...');
        const [contasReceberResult, contasPagarResult] = await Promise.all([
          supabase
            .from('contas_receber')
            .select('id, descricao, valor, data_vencimento')
            .eq('status', 'pendente'),
          supabase
            .from('contas_pagar')
            .select('id, descricao, valor, data_vencimento')
            .eq('status', 'pendente')
        ]);

        const contasAbertas: ContaAberta[] = [];
        
        // Processar contas a receber
        if (contasReceberResult.data) {
          contasReceberResult.data.forEach(conta => {
            const diasVencimento = Math.ceil((new Date().getTime() - new Date(conta.data_vencimento).getTime()) / (1000 * 3600 * 24));
            contasAbertas.push({
              id: conta.id,
              descricao: conta.descricao,
              valor: conta.valor,
              data_vencimento: conta.data_vencimento,
              tipo: 'receber',
              dias_vencimento: diasVencimento,
            });
          });
        }
        
        // Processar contas a pagar
        if (contasPagarResult.data) {
          contasPagarResult.data.forEach(conta => {
            const diasVencimento = Math.ceil((new Date().getTime() - new Date(conta.data_vencimento).getTime()) / (1000 * 3600 * 24));
            contasAbertas.push({
              id: conta.id,
              descricao: conta.descricao,
              valor: conta.valor,
              data_vencimento: conta.data_vencimento,
              tipo: 'pagar',
              dias_vencimento: diasVencimento,
            });
          });
        }

        // Ordenar por vencimento mais próximo
        contasAbertas.sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

        const stats = {
          totalVendas,
          faturamentoMensal,
          clientesAtivos: clientesUnicos,
          produtosBaixoEstoque: produtosComBaixoEstoque?.length || 0,
          vendasRecentes: vendasRecentes || [],
          alertasEstoque: produtosComBaixoEstoque || [],
          salesChart,
          contasAbertas,
        };

        console.log('Estatísticas carregadas com sucesso:', stats);
        return stats;
      } catch (error) {
        console.error('Erro geral ao carregar estatísticas:', error);
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}