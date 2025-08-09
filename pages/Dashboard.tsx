import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { InventoryAlerts } from "@/components/dashboard/inventory-alerts";

import { AccountsSummary } from "@/components/dashboard/accounts-summary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-destructive">
              Erro ao carregar dados do dashboard
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Faturamento do Mês"
            value={`R$ ${stats?.faturamentoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
            change={`${stats?.totalVendas || 0} vendas realizadas`}
            changeType="positive"
            icon={DollarSign}
            gradient
          />
          <StatsCard
            title="Vendas do Mês"
            value={stats?.totalVendas.toString() || "0"}
            change="vendas finalizadas"
            changeType="positive"
            icon={ShoppingCart}
          />
          <StatsCard
            title="Clientes Ativos"
            value={stats?.clientesAtivos.toString() || "0"}
            change="clientes com compras recentes"
            changeType="positive"
            icon={Users}
          />
          <StatsCard
            title="Alertas de Estoque"
            value={stats?.produtosBaixoEstoque.toString() || "0"}
            change="produtos com estoque baixo"
            changeType={stats?.produtosBaixoEstoque ? "negative" : "positive"}
            icon={Package}
          />
        </div>

        {/* Inventory Alerts */}
        <InventoryAlerts alertas={stats?.alertasEstoque || []} />

        {/* Accounts Summary */}
        <AccountsSummary contasAbertas={stats?.contasAbertas || []} />

        {/* Recent Sales */}
        <RecentSales vendas={stats?.vendasRecentes || []} />
      </div>
    </MainLayout>
  );
}