import { useState } from "react";
import { useRHData } from "@/hooks/useRHData";
import { RHSidebarNav } from "./RHSidebarNav";
import { ColaboradoresAnalysis } from "./ColaboradoresAnalysis";
import { ColaboradoresTable } from "./ColaboradoresTable";
import { AdminPanel } from "@/components/dashboard/AdminPanel";
import { Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useKestraStatus } from "@/hooks/useKestraStatus";
import { RefreshCcw, CheckCircle2, Clock, XCircle, AlertCircle as AlertIcon } from "lucide-react";

function RHDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
      {/* Second charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export function RHDashboard() {
  const { data, isLoading } = useRHData();
  const [activeTab, setActiveTab] = useState("colaboradores");
  const navigate = useNavigate();
  const { status: kestraStatus, isLoading: isKestraLoading } = useKestraStatus();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    toast.info("Sessão encerrada.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <RHSidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="ml-14 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-extrabold text-primary tracking-tight">Score Data Hub</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Gestão de Pessoas</p>
          </div>
          <div className="flex items-center gap-4">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="p-6">
          {/* Home tab */}
          {activeTab === "home" && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Home className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Bem-vindo ao Módulo de RH</h2>
              <p className="text-muted-foreground max-w-md">
                Use a barra lateral para navegar entre as análises de colaboradores, perfis DISC e mapa de talentos.
              </p>
            </div>
          )}

          {/* Colaboradores tab */}
          {activeTab === "colaboradores" && (
            isLoading
              ? <RHDashboardSkeleton />
              : <ColaboradoresAnalysis data={data ?? { kpis: null, headcountDept: [], distribuicaoDisc: [], mapaTalentos: [] }} />
          )}

          {/* Pessoas tab */}
          {activeTab === "pessoas" && <ColaboradoresTable />}

          {/* Admin tab */}
          {activeTab === "admin" && <AdminPanel />}
        </main>
      </div>
    </div>
  );
}
