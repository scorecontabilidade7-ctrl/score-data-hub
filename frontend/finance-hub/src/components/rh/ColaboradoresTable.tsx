import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { solidesSupabase } from "@/integrations/supabase/external-client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Colaborador {
  id: number;
  colaborador_id: string;
  nome: string;
  email: string;
  genero: string;
  status: string;
  cargo_nome: string;
  departamento_nome: string;
  salario: number | null;
  tipo_contrato: string;
  data_admissao: string | null;
  tempo_empresa_meses: number;
  perfil_dominante: string | null;
  nivel_energia: number | null;
  indice_satisfacao: number | null;
}

type SortKey = keyof Colaborador;
type SortDir = "asc" | "desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBRL(v: number | null) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function tempoCasa(meses: number): string {
  if (meses < 12) return `${meses}m`;
  const anos = Math.floor(meses / 12);
  const m = meses % 12;
  return m > 0 ? `${anos}a ${m}m` : `${anos} ano${anos > 1 ? "s" : ""}`;
}

function tempoCasaBucket(meses: number): string {
  if (meses < 12) return "< 1 ano";
  if (meses < 36) return "1-3 anos";
  if (meses < 60) return "3-5 anos";
  return "> 5 anos";
}

const DISC_COLORS: Record<string, string> = {
  executor:     "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  comunicador:  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  planejador:   "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  analista:     "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

const STATUS_COLORS: Record<string, string> = {
  ativo:     "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  afastado:  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "férias":  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>;
  const stars = Math.round((value / 100) * 5);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={cn("w-3 h-3", i <= stars ? "text-amber-400" : "text-muted-foreground/30")} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Energy Badge ─────────────────────────────────────────────────────────────
function EnergyBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>;
  const score = Math.round(value / 10);
  const color = score >= 7 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : score >= 4 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              :              "bg-rose-500/15 text-rose-600 dark:text-rose-400";
  return (
    <span className={cn("inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold", color)}>
      {score}
    </span>
  );
}

// ─── Sort Header ──────────────────────────────────────────────────────────────
function SortTh({
  label, field, sortKey, sortDir, onSort
}: {
  label: string; field: SortKey;
  sortKey: SortKey; sortDir: SortDir;
  onSort: (f: SortKey) => void;
}) {
  const active = sortKey === field;
  return (
    <th
      className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          : <ArrowUpDown className="h-3 w-3 opacity-30" />
        }
      </div>
    </th>
  );
}

// ─── Data Hook ────────────────────────────────────────────────────────────────
function useColaboradores() {
  return useQuery<Colaborador[]>({
    queryKey: ["rh_colaboradores"],
    queryFn: async () => {
      const { data, error } = await solidesSupabase
        .from("rh_colaboradores")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ColaboradoresTable() {
  const { data: colaboradores = [], isLoading } = useColaboradores();

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("todos");
  const [filterCargo, setFilterCargo] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterTempo, setFilterTempo] = useState("todos");
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Unique filter options
  const depts  = useMemo(() => ["todos", ...Array.from(new Set(colaboradores.map(c => c.departamento_nome).filter(Boolean))).sort()], [colaboradores]);
  const cargos = useMemo(() => ["todos", ...Array.from(new Set(colaboradores.map(c => c.cargo_nome).filter(Boolean))).sort()], [colaboradores]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = colaboradores.filter(c => {
      const q = search.toLowerCase();
      if (q && !c.nome?.toLowerCase().includes(q) &&
               !c.departamento_nome?.toLowerCase().includes(q) &&
               !c.cargo_nome?.toLowerCase().includes(q)) return false;
      if (filterDept   !== "todos" && c.departamento_nome !== filterDept)   return false;
      if (filterCargo  !== "todos" && c.cargo_nome        !== filterCargo)  return false;
      if (filterStatus !== "todos" && c.status            !== filterStatus) return false;
      if (filterTempo  !== "todos" && tempoCasaBucket(c.tempo_empresa_meses) !== filterTempo) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [colaboradores, search, filterDept, filterCargo, filterStatus, filterTempo, sortKey, sortDir]);

  function handleSort(field: SortKey) {
    if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(field); setSortDir("asc"); }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-in fade-in duration-300">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">{filtered.length} colaborador{filtered.length !== 1 ? "es" : ""}</p>
          <p className="text-[11px] text-muted-foreground">Detalhes individuais dos colaboradores</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, dept. ou cargo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-card"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <Card className="flex-1 border-0 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <SortTh label="Nome"           field="nome"               sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Departamento"   field="departamento_nome"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Cargo"          field="cargo_nome"         sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Salário"        field="salario"            sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Energia"        field="nivel_energia"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Satisfação"     field="indice_satisfacao"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Admissão"       field="data_admissao"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Tempo de casa"  field="tempo_empresa_meses" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhum colaborador encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      {/* Nome + perfil + status */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground text-[13px] leading-tight">{c.nome}</span>
                          <div className="flex items-center gap-1.5">
                            {c.status && (
                              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground")}>
                                {c.status}
                              </span>
                            )}
                            {c.perfil_dominante && c.perfil_dominante !== "não mapeado" && (
                              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize", DISC_COLORS[c.perfil_dominante] ?? "bg-muted text-muted-foreground")}>
                                {c.perfil_dominante}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Departamento */}
                      <td className="px-3 py-2.5 text-[13px] text-foreground">{c.departamento_nome ?? "—"}</td>
                      {/* Cargo */}
                      <td className="px-3 py-2.5 text-[13px] text-foreground">{c.cargo_nome ?? "—"}</td>
                      {/* Salário */}
                      <td className="px-3 py-2.5 text-[13px] font-semibold text-foreground tabular-nums">{formatBRL(c.salario)}</td>
                      {/* Energia */}
                      <td className="px-3 py-2.5"><EnergyBadge value={c.nivel_energia} /></td>
                      {/* Satisfação */}
                      <td className="px-3 py-2.5"><Stars value={c.indice_satisfacao} /></td>
                      {/* Admissão */}
                      <td className="px-3 py-2.5 text-[13px] text-muted-foreground">{formatDate(c.data_admissao)}</td>
                      {/* Tempo */}
                      <td className="px-3 py-2.5">
                        <span className="text-[12px] font-medium text-foreground">{tempoCasa(c.tempo_empresa_meses)}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{tempoCasaBucket(c.tempo_empresa_meses)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Filters sidebar */}
        <div className="w-44 shrink-0 space-y-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Filtros</p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">Departamento</label>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="h-8 text-xs bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {depts.map(d => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d === "todos" ? "Todos" : d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">Cargo</label>
            <Select value={filterCargo} onValueChange={setFilterCargo}>
              <SelectTrigger className="h-8 text-xs bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cargos.map(c => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c === "todos" ? "Todos" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                <SelectItem value="ativo" className="text-xs">Ativo</SelectItem>
                <SelectItem value="afastado" className="text-xs">Afastado</SelectItem>
                <SelectItem value="férias" className="text-xs">Férias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">Tempo de casa</label>
            <Select value={filterTempo} onValueChange={setFilterTempo}>
              <SelectTrigger className="h-8 text-xs bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                <SelectItem value="< 1 ano" className="text-xs">&lt; 1 ano</SelectItem>
                <SelectItem value="1-3 anos" className="text-xs">1-3 anos</SelectItem>
                <SelectItem value="3-5 anos" className="text-xs">3-5 anos</SelectItem>
                <SelectItem value="> 5 anos" className="text-xs">&gt; 5 anos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
