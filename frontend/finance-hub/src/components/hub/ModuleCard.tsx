import { LucideIcon, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  route?: string;
  disabled?: boolean;
  accentColor?: string;
}

export function ModuleCard({ title, description, icon: Icon, route, disabled, accentColor = "bg-primary" }: ModuleCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => route && !disabled && navigate(route)}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col rounded-xl bg-card shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-md transition-all duration-200 overflow-hidden text-left w-full",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5"
      )}
    >
      {/* Thumbnail area */}
      <div className={cn("h-36 w-full flex items-center justify-center", accentColor)}>
        <Icon className="h-14 w-14 text-white/90" strokeWidth={1.5} />
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Módulo</span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        {disabled && (
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mt-1">Em breve</span>
        )}
      </div>
    </button>
  );
}

export function AddModuleCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 h-full min-h-[240px] text-muted-foreground/40 hover:border-primary/30 hover:text-primary/40 transition-colors cursor-default">
      <Plus className="h-10 w-10 mb-2" />
      <span className="text-xs font-medium">Novo módulo</span>
    </div>
  );
}
