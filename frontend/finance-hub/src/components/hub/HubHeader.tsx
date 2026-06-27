import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import logoScore from "@/assets/logo_score.png";

export function HubHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    toast.info("Sessão encerrada.");
    navigate("/login");
  };

  return (
    <header className="w-full bg-card border-b border-border px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={logoScore} alt="Score" className="w-9 h-9 object-contain" />
        <div>
          <h1 className="text-lg font-extrabold text-primary tracking-tight leading-none">Score Data Hub</h1>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Plataforma de Inteligência</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-500 gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
