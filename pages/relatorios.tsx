import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, TrendingUp, PieChart, Target } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Import dos componentes de relatórios
import { ProdutosMaisVendidos } from "@/components/reports/produtos-mais-vendidos";
import { DemonstrativoFinanceiro } from "@/components/reports/demonstrativo-financeiro";
import { MargemLucro } from "@/components/reports/margem-lucro";
import { CrescimentoCharts } from "@/components/reports/crescimento-charts";

export default function Relatorios() {
  const hoje = new Date();
  const [dataInicio, setDataInicio] = useState<Date>(startOfMonth(hoje));
  const [dataFim, setDataFim] = useState<Date>(endOfMonth(hoje));

  const periodo = {
    inicio: dataInicio.toISOString().split('T')[0],
    fim: dataFim.toISOString().split('T')[0],
  };

  const setPeriodoRapido = (dias: number) => {
    const fim = new Date();
    const inicio = subDays(fim, dias);
    setDataInicio(inicio);
    setDataFim(fim);
  };

  const setPeriodoMesAtual = () => {
    setDataInicio(startOfMonth(hoje));
    setDataFim(endOfMonth(hoje));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho do seu negócio
          </p>
        </div>

        {/* Filtros de Período */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Período de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {/* Botões de período rápido */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setPeriodoRapido(7)}>
                  Últimos 7 dias
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPeriodoRapido(30)}>
                  Últimos 30 dias
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPeriodoRapido(90)}>
                  Últimos 90 dias
                </Button>
                <Button variant="outline" size="sm" onClick={setPeriodoMesAtual}>
                  Mês atual
                </Button>
              </div>

              {/* Seletores de data personalizados */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataInicio}
                      onSelect={(date) => date && setDataInicio(date)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">até</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy") : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataFim}
                      onSelect={(date) => date && setDataFim(date)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Relatórios */}
        <Tabs defaultValue="produtos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="produtos" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="margem" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Margem</span>
            </TabsTrigger>
            <TabsTrigger value="crescimento" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Crescimento</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="space-y-6">
            <ProdutosMaisVendidos periodo={periodo} />
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            <DemonstrativoFinanceiro periodo={periodo} />
          </TabsContent>

          <TabsContent value="margem" className="space-y-6">
            <MargemLucro />
          </TabsContent>

          <TabsContent value="crescimento" className="space-y-6">
            <CrescimentoCharts />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}