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
            {data?.kpis?.refreshed_at && (
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                Atualizado em{" "}
                {new Date(data.kpis.refreshed_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
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
