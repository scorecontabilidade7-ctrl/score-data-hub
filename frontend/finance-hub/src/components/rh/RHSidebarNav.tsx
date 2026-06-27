import { Home, Users, LayoutList, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigate } from "react-router-dom";
import logoScore from "@/assets/logo_score.png";

interface RHSidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "colaboradores", icon: Users, label: "Análise de Colaboradores" },
  { id: "pessoas", icon: LayoutList, label: "Pessoas" },
];

export function RHSidebarNav({ activeTab, onTabChange }: RHSidebarNavProps) {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="fixed left-0 top-0 h-screen w-14 bg-card border-r border-border flex flex-col items-center py-4 gap-1 z-50">
      {/* Logo */}
      <div className="mb-3 w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
        <img src={logoScore} alt="Score" className="w-9 h-9 object-contain" />
      </div>

      {/* Back to Hub */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">Voltar ao Hub</TooltipContent>
      </Tooltip>

      {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
        <Tooltip key={id} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onTabChange(id)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                activeTab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      ))}

      {/* Bottom area */}
      <div className="mt-auto border-t border-border pt-4 w-full flex flex-col items-center gap-1">
        <ThemeToggle />
        {isAdmin && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onTabChange("admin")}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  activeTab === "admin"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <ShieldCheck className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Painel Admin</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
