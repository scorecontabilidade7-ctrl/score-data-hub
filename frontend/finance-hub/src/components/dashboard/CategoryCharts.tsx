import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { groupByCategory, groupByDfcGrupo, groupByFormaPagamento, formatBRL } from "@/lib/finance-utils";
import type { MovimentacaoFinanceira } from "@/hooks/useFinanceData";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CategoryChartsProps {
  data: MovimentacaoFinanceira[];
}

const TABS = [
  { id: "categoria", label: "Categoria" },
  { id: "natureza", label: "Natureza" },
  { id: "contas", label: "Contas" },
];

const DONUT_COLORS = [
  "#0d9488", // teal-600
  "#0891b2", // cyan-600
  "#2563eb", // blue-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#ea580c", // orange-600
  "#65a30d", // lime-600
  "#ca8a04", // yellow-600
];

/* ─── Tooltip simples ─── */
function SimpleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-card p-2.5 rounded-lg shadow-xl border border-border text-xs space-y-0.5">
      <p className="font-bold text-foreground">{item.name}</p>
      <p className="tabular-nums text-primary font-semibold">{formatBRL(item.value ?? 0)}</p>
    </div>
  );
}

function DonutTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
  return (
    <div className="bg-card p-2.5 rounded-lg shadow-xl border border-border text-xs space-y-0.5">
      <p className="font-bold text-foreground">{item.name}</p>
      <p className="tabular-nums text-muted-foreground">{formatBRL(item.value)}</p>
      <p className="text-primary font-semibold">{pct}%</p>
    </div>
  );
}

/* ─── Barra de performance com valor sempre visível ─── */
function PerformanceBar({ name, value, maxValue, color = "hsl(var(--primary))" }: {
  name: string; value: number; maxValue: number; color?: string;
}) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 4;
  const showInside = pct > 35;

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] text-muted-foreground w-[110px] text-right truncate flex-shrink-0 leading-tight" title={name}>
        {name}
      </span>
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden relative">
          <div
            className="h-full rounded transition-all duration-500 flex items-center"
            style={{ width: `${pct}%`, background: color }}
          >
            {showInside && (
              <span className="text-[9px] font-bold text-white tabular-nums whitespace-nowrap px-1.5 overflow-hidden">
                {formatBRL(value)}
              </span>
            )}
          </div>
        </div>
        {!showInside && (
          <span className="text-[10px] font-semibold tabular-nums text-foreground whitespace-nowrap flex-shrink-0">
            {formatBRL(value)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Legenda customizada do donut ─── */
function DonutLegend({ items, total }: { items: { name: string; value: number }[]; total: number }) {
  return (
    <div className="space-y-1 mt-2">
      {items.map((item, i) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
        return (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="text-[10px] text-muted-foreground truncate flex-1 min-w-0" title={item.name}>
              {item.name}
            </span>
            <span className="text-[10px] font-semibold tabular-nums text-foreground flex-shrink-0">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tab: Categoria ─── */
function TabCategoria({ data }: { data: MovimentacaoFinanceira[] }) {
  const entradas = groupByCategory(data, "Entrada").slice(0, 6);
  const saidas = groupByCategory(data, "Saída").slice(0, 6);
  const maxEntrada = entradas[0]?.value ?? 1;
  const maxSaida = saidas[0]?.value ?? 1;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[9px] font-bold tracking-[0.1em] text-foreground uppercase mb-2">PERFORMANCE ENTRADAS</h4>
        <div className="space-y-0.5">
          {entradas.map((item) => (
            <PerformanceBar key={item.name} name={item.name} value={item.value} maxValue={maxEntrada} />
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-[9px] font-bold tracking-[0.1em] text-foreground uppercase mb-2">PERFORMANCE SAÍDAS</h4>
        <div className="space-y-0.5">
          {saidas.map((item) => (
            <PerformanceBar key={item.name} name={item.name} value={item.value} maxValue={maxSaida} color="#ef4444" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Natureza ─── */
function TabNatureza({ data }: { data: MovimentacaoFinanceira[] }) {
  const despesas = useMemo(() => groupByDfcGrupo(data, "Saída"), [data]);
  const receitas = useMemo(() => groupByDfcGrupo(data, "Entrada"), [data]);
  const totalDespesas = despesas.reduce((s, e) => s + e.value, 0);
  const maxReceita = receitas[0]?.value ?? 1;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[9px] font-bold tracking-[0.1em] text-foreground uppercase mb-2">COMPOSIÇÃO DE DESPESAS</h4>
        <div className="flex gap-4 items-start">
          {/* Donut — tamanho fixo, sem Legend interna */}
          <div className="flex-shrink-0 w-[140px] h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={despesas}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {despesas.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={totalDespesas} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda customizada ao lado */}
          <div className="flex-1 min-w-0">
            <DonutLegend items={despesas} total={totalDespesas} />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-[9px] font-bold tracking-[0.1em] text-foreground uppercase mb-2">PERFORMANCE RECEITAS</h4>
        <div className="space-y-0.5">
          {receitas.slice(0, 5).map((item, i) => (
            <PerformanceBar
              key={item.name}
              name={item.name}
              value={item.value}
              maxValue={maxReceita}
              color={DONUT_COLORS[i % DONUT_COLORS.length]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Contas ─── */
function TabContas({ data }: { data: MovimentacaoFinanceira[] }) {
  const formaData = useMemo(() => groupByFormaPagamento(data).slice(0, 6), [data]);
  const maxVal = formaData.reduce((m, d) => Math.max(m, d.entradas, d.saidas), 1);

  return (
    <div>
      <h4 className="text-[9px] font-bold tracking-[0.1em] text-foreground uppercase mb-3">FORMA DE PAGAMENTO</h4>
      <div className="space-y-2">
        {formaData.map((item) => (
          <div key={item.name} className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-medium">{item.name}</span>
            <div className="flex gap-1">
              {/* Entrada */}
              <div className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{ width: `${Math.max((item.entradas / maxVal) * 100, 4)}%`, background: "hsl(var(--primary))" }}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-foreground w-[70px] flex-shrink-0">{formatBRL(item.entradas)}</span>
              </div>
              {/* Saída */}
              <div className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{ width: `${Math.max((item.saidas / maxVal) * 100, 4)}%`, background: "#ef4444" }}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-foreground w-[70px] flex-shrink-0">{formatBRL(item.saidas)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 pt-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "hsl(var(--primary))" }} /> Entradas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block bg-red-500" /> Saídas
        </span>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export function CategoryCharts({ data }: CategoryChartsProps) {
  const [activeTab, setActiveTab] = useState("categoria");

  return (
    <Card className="p-5 border-0 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] h-fit">
      <div className="flex items-center gap-1.5 mb-4">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200",
              activeTab === id
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-accent border border-border"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "categoria" && <TabCategoria data={data} />}
      {activeTab === "natureza" && <TabNatureza data={data} />}
      {activeTab === "contas" && <TabContas data={data} />}
    </Card>
  );
}
