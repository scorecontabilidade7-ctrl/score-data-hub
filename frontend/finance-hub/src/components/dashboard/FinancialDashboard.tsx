import { useState, useMemo, useEffect } from "react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useAuth } from "@/hooks/useAuth";
import type { MovimentacaoFinanceira, DateField } from "@/hooks/useFinanceData";
import { SidebarNav } from "./SidebarNav";
import { KPICards } from "./KPICards";
import { CategoryCharts } from "./CategoryCharts";
import { MonthlyChart } from "./MonthlyChart";
import { RevenueCostChart } from "./RevenueCostChart";
import { DFCMatrix } from "./DFCMatrix";
import { ExtratoTable } from "./ExtratoTable";
import { ContasReceber } from "./ContasReceber";
import { ContasPagar } from "./ContasPagar";
import { AdminPanel } from "./AdminPanel";
import { OrcamentoPrevisto } from "./OrcamentoPrevisto";
import { AIAgent } from "./AIAgent";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { AlertCircle, Home, BarChart3, ShieldCheck, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useKestraStatus } from "@/hooks/useKestraStatus";
import { RefreshCcw, CheckCircle2, Clock, XCircle, AlertCircle as AlertIcon } from "lucide-react";

function DateRangeFilter({
  startDate, endDate, onStartChange, onEndChange
}: { startDate: string; endDate: string; onStartChange: (v: string) => void; onEndChange: (v: string) => void; }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="h-8 text-xs w-[145px] bg-card border-border rounded-lg"
      />
      <span className="text-muted-foreground text-xs">—</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="h-8 text-xs w-[145px] bg-card border-border rounded-lg"
      />
    </div>
  );
}

function filterByDate(data: MovimentacaoFinanceira[], start: string, end: string, dateField: DateField) {
  if (!start && !end) return data;
  return data.filter((d) => {
    const raw = d[dateField] as string | null;
    const date = (raw || "").slice(0, 10);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

export function FinancialDashboard() {
  const { data, isLoading, error } = useFinanceData();
  const [activeTab, setActiveTab] = useState("visao-geral");
  // Separate date ranges per dateField so switching tabs doesn't reset user filters
  const [dateRanges, setDateRanges] = useState<Record<string, { start: string; end: string }>>({});
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { status: kestraStatus, isLoading: isKestraLoading } = useKestraStatus();

  const handleLogout = async () => {
    await signOut();
    toast.info("Sessão encerrada.");
    navigate("/login");
  };

  const dateField: DateField =
    activeTab === "dre" || activeTab === "a-receber" || activeTab === "a-pagar" || activeTab === "orcamento"
      ? "data_emissao"
      : "data_pagamento"; // orcamento-dfc, dfc, extrato, visao-geral → data_pagamento

  const startDate = dateRanges[dateField]?.start ?? "";
  const endDate   = dateRanges[dateField]?.end   ?? "";

  const setStartDate = (v: string) =>
    setDateRanges(prev => ({ ...prev, [dateField]: { start: v, end: prev[dateField]?.end ?? "" } }));
  const setEndDate = (v: string) =>
    setDateRanges(prev => ({ ...prev, [dateField]: { start: prev[dateField]?.start ?? "", end: v } }));

  // Auto-set date range on first load for each dateField (only when not yet set)
  useEffect(() => {
    if (data && data.length > 0 && !dateRanges[dateField]?.start) {
      const dates = data
        .map((d) => (d[dateField] as string | null)?.slice(0, 10))
        .filter(Boolean)
        .sort() as string[];
      if (dates.length) {
        setDateRanges(prev => ({
          ...prev,
          [dateField]: { start: dates[0], end: dates[dates.length - 1] },
        }));
      }
    }
  }, [data, dateField]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredData = useMemo(() => {
    if (!data) return [];
    return filterByDate(data, startDate, endDate, dateField);
  }, [data, startDate, endDate, dateField]);

  return (
    <div className="min-h-screen bg-background flex">
      <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="ml-14 flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-extrabold text-primary tracking-tight">Score Data Hub</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Análise Financeira</p>
          </div>
          <div className="flex items-center gap-4">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
            />

            {/* Kestra Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 border border-border rounded-lg text-xs">
              {isKestraLoading ? (
                <RefreshCcw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : kestraStatus ? (
                <>
                  <a
                    href={kestraStatus.kestraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    title={`Ver logs no Kestra (${kestraStatus.status})`}
                  >
                    {kestraStatus.status === 'Sucesso' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    {kestraStatus.status === 'Em Execução' && <RefreshCcw className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                    {kestraStatus.status === 'Falha' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    {kestraStatus.status === 'Pausado' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                    {kestraStatus.status === 'Desconhecido' && <AlertIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                    
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase leading-tight">Sincronização</span>
                      <span className="font-medium text-foreground leading-tight">{kestraStatus.lastUpdated}</span>
                    </div>
                  </a>
                </>
              ) : (
                <span className="text-muted-foreground text-[10px]">Status Indisponível</span>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-500 transition-colors">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="p-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive mb-6">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">Erro ao carregar dados financeiros.</p>
            </div>
          )}

          {isLoading ? (
            <DashboardSkeleton />
          ) : filteredData.length > 0 ? (
            <>
              {activeTab === "home" && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Home className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Bem-vindo ao Painel Financeiro</h2>
                  <p className="text-muted-foreground max-w-md">
                    Use a barra lateral para navegar entre as diferentes análises: Visão Geral, DFC, DRE e mais.
                  </p>
                </div>
              )}
              {activeTab === "visao-geral" && (
                <div className="space-y-6">
                  <KPICards data={filteredData} allData={data || []} dateField={dateField} />
                  <RevenueCostChart data={filteredData} dateField={dateField} />
                  <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6">
                    <MonthlyChart data={filteredData} dateField={dateField} />
                    <CategoryCharts data={filteredData} />
                  </div>
                </div>
              )}
              {activeTab === "dfc" && (
                <DFCMatrix data={filteredData} dateField="data_pagamento" regime="caixa" />
              )}
              {activeTab === "dre" && (
                <DFCMatrix data={filteredData} dateField="data_emissao" regime="competencia" />
              )}
              {activeTab === "a-receber" && (
                <ContasReceber data={filteredData} dateField={dateField} />
              )}
              {activeTab === "a-pagar" && (
                <ContasPagar data={filteredData} dateField={dateField} />
              )}
              {activeTab === "extrato" && (
                <ExtratoTable data={filteredData} dateField={dateField} />
              )}
              {activeTab === "indicadores" && (
                <AIAgent
                  data={filteredData}
                  dateField={dateField}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
              {activeTab === "orcamento" && (
                <OrcamentoPrevisto data={filteredData} dateField="data_emissao" tipo="dre" />
              )}
              {activeTab === "orcamento-dfc" && (
                <OrcamentoPrevisto data={filteredData} dateField="data_pagamento" tipo="dfc" />
              )}
              {activeTab === "admin" && (
                <AdminPanel />
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum dado encontrado para o período selecionado.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
