import { DollarSign, FlaskConical, Users } from "lucide-react";
import { HubHeader } from "@/components/hub/HubHeader";
import { ModuleCard, AddModuleCard } from "@/components/hub/ModuleCard";
import { useAuth } from "@/hooks/useAuth";

const MODULES = [
  {
    id: "financeiro",
    title: "Financeiro",
    description: "DFC, DRE, extratos e indicadores financeiros consolidados.",
    icon: DollarSign,
    route: "/financeiro",
    accentColor: "bg-primary",
  },
  {
    id: "pdi",
    title: "PD&I",
    description: "Pesquisa, desenvolvimento e inovação tecnológica.",
    icon: FlaskConical,
    disabled: true,
    accentColor: "bg-chart-blue",
  },
  {
    id: "rh",
    title: "RH",
    description: "Gestão de pessoas, folha e indicadores de capital humano.",
    icon: Users,
    disabled: true,
    accentColor: "bg-chart-red",
  },
];

export default function Home() {
  const { profile } = useAuth();
  const allowedModules = profile?.modules || [];

  return (
    <div className="min-h-screen bg-background">
      <HubHeader />

      <main className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Bem-vindo ao Score Data Hub</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
            Selecione um módulo para acessar os painéis de inteligência de dados da sua empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {MODULES.filter(m => profile?.role === "admin" || allowedModules.includes(m.id)).map((m) => (
            <ModuleCard key={m.title} {...m} />
          ))}
          {profile?.role === "admin" && <AddModuleCard />}
        </div>
      </main>
    </div>
  );
}
