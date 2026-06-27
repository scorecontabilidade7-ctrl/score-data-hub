import { useMemo, useState } from "react";
import type { DateField, MovimentacaoFinanceira } from "@/hooks/useFinanceData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBRL, getMonthKeyFromRow, isSaida } from "@/lib/finance-utils";
import { ChevronDown } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function sortMonthKey(a: string, b: string) {
  const [mA, yA] = a.split("/");
  const [mB, yB] = b.split("/");
  return Number(yA) - Number(yB) || MONTHS.indexOf(mA) - MONTHS.indexOf(mB);
}

function normalizeGroup(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : "Outros";
}

function makeKey(kind: "entrada" | "saida", group: string) {
  return `${kind}::${group}`;
}

function makeLabel(kind: "entrada" | "saida", group: string) {
  return `${kind === "entrada" ? "Entrada" : "Saída"} • ${group}`;
}

function hashToColor(key: string) {
  const palette = [
    "hsl(var(--chart-blue))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted-foreground))",
  ];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

type IndicatorOption = { key: string; label: string };

function buildChart(data: MovimentacaoFinanceira[], dateField: DateField, topN: number) {
  const monthMap = new Map<string, {
    receita: number;
    custosVariaveis: number;
    custosFixos: number;
    indicadores: Record<string, number>;
  }>();
  const totals = new Map<string, number>();

  data.forEach((d) => {
    const month = getMonthKeyFromRow(d, dateField);
    if (!month) return;

    const bucket = monthMap.get(month) ?? { receita: 0, custosVariaveis: 0, custosFixos: 0, indicadores: {} };
    const valor = Number(d.valor_liquido ?? 0);
    const mascara = String(d.dfc_mascara ?? "");

    if (d.tipo_movimento === "Entrada") {
      bucket.receita += valor;
      const group = normalizeGroup(d.dfc_grupo);
      const k = makeKey("entrada", group);
      bucket.indicadores[k] = (bucket.indicadores[k] ?? 0) + valor;
      totals.set(k, (totals.get(k) ?? 0) + valor);
    } else if (isSaida(d)) {
      const absVal = Math.abs(valor);
      const group = normalizeGroup(d.dfc_grupo);
      const k = makeKey("saida", group);
      bucket.indicadores[k] = (bucket.indicadores[k] ?? 0) + absVal;
      totals.set(k, (totals.get(k) ?? 0) + absVal);
      bucket.indicadores["saidas_total"] = (bucket.indicadores["saidas_total"] ?? 0) + absVal;
      totals.set("saidas_total", (totals.get("saidas_total") ?? 0) + absVal);

      // Separar custos variáveis (4) de custos fixos (5 e 6) para o PE
      if (mascara.includes("4 - Custos Variáveis")) {
        bucket.custosVariaveis += absVal;
      } else if (mascara.includes("5 - Despesas Gerais") || mascara.includes("6 - Investimentos")) {
        bucket.custosFixos += absVal;
      }
    }

    monthMap.set(month, bucket);
  });

  const all = Array.from(totals.entries())
    .filter(([k]) => k !== "saidas_total")
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([k]) => k);

  const options: IndicatorOption[] = [
    { key: "saidas_total", label: "Saídas Totais" },
    ...all.map((k) => {
      const [kind, group] = k.split("::");
      return { key: k, label: makeLabel(kind === "entrada" ? "entrada" : "saida", group || "Outros") };
    }),
  ];

  const rows = Array.from(monthMap.entries())
    .sort(([a], [b]) => sortMonthKey(a, b))
    .map(([month, bucket]) => {
      const mcPct = bucket.receita > 0
        ? (bucket.receita - bucket.custosVariaveis) / bucket.receita
        : null;
      const pe = mcPct && mcPct > 0 ? bucket.custosFixos / mcPct : null;

      const row: Record<string, number | string | null> = {
        month,
        receita: bucket.receita,
        pe,
      };
      Object.entries(bucket.indicadores).forEach(([k, v]) => { row[k] = v; });
      return row;
    });

  return { rows, options };
}

export function RevenueCostChart({ data, dateField }: { data: MovimentacaoFinanceira[]; dateField: DateField }) {
  const { rows, options } = useMemo(() => buildChart(data, dateField, 20), [data, dateField]);
  const [selected, setSelected] = useState<string[]>(["saidas_total"]);
  const [showPE, setShowPE] = useState(true);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const selectedOptions = useMemo(() => {
    const map = new Map(options.map((o) => [o.key, o]));
    return selected.map((k) => map.get(k)).filter(Boolean) as IndicatorOption[];
  }, [options, selected]);

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function pickTop(n: number) {
    const top = options
      .filter((o) => o.key !== "saidas_total")
      .slice(0, n)
      .map((o) => o.key);
    setSelected(["saidas_total", ...top]);
  }

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;

    const items = payload
      .filter((p: any) => p?.dataKey && p?.value != null)
      .map((p: any) => ({
        key: String(p.dataKey),
        value: Number(p.value),
        color: String(p.color || p.stroke || "#111"),
      }));

    const receita = items.find((i) => i.key === "receita")?.value ?? 0;
    const peItem = items.find((i) => i.key === "pe");
    const peValue = peItem?.value ?? null;
    const selectedItems = items
      .filter((i) => i.key !== "receita" && i.key !== "pe" && selectedSet.has(i.key))
      .sort((a, b) => b.value - a.value);

    const labelMap = new Map(options.map((o) => [o.key, o.label]));
    const abovePE = peValue !== null ? receita >= peValue : null;

    return (
      <div className="bg-card p-3.5 rounded-xl shadow-xl border border-border text-xs space-y-2 min-w-[240px]">
        <p className="font-bold text-foreground">{label}</p>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "hsl(var(--primary))" }} />
            <span className="text-muted-foreground">Receita</span>
          </div>
          <span className="font-semibold tabular-nums text-foreground">{formatBRL(receita)}</span>
        </div>

        {showPE && peValue !== null && (
          <div className="pt-2 border-t border-border space-y-1.5">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-0.5 inline-block border-t-2 border-dashed" style={{ borderColor: "#f59e0b" }} />
                <span className="text-muted-foreground">Ponto de Equilíbrio</span>
              </div>
              <span className="font-semibold tabular-nums text-foreground">{formatBRL(peValue)}</span>
            </div>
            <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded w-fit ${abovePE ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
              {abovePE ? "▲ Acima do equilíbrio" : "▼ Abaixo do equilíbrio"}
            </div>
          </div>
        )}

        {selectedItems.length > 0 && (
          <div className="pt-2 border-t border-border space-y-1.5">
            {selectedItems.slice(0, 8).map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{labelMap.get(c.key) ?? c.key}</span>
                </div>
                <span className="font-semibold tabular-nums text-foreground">{formatBRL(c.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="p-4 pb-2 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Receita x Indicadores</h3>
          <p className="text-xs text-muted-foreground">Receita (linha) comparada com indicadores selecionados (colunas)</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPE((v) => !v)}
            className={`text-[10px] px-2 py-1 rounded border transition-colors ${showPE ? "bg-amber-500 text-white border-amber-500" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
            title="Mostrar/ocultar Ponto de Equilíbrio"
          >
            PE
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Indicadores ({selected.length})
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px] max-h-[420px] overflow-auto">
              <DropdownMenuLabel>Selecionar indicadores</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setSelected([]);
                }}
              >
                Limpar seleção
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  pickTop(4);
                }}
              >
                Selecionar principais
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {options.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.key}
                  checked={selectedSet.has(opt.key)}
                  onCheckedChange={() => toggle(opt.key)}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={rows} margin={{ top: 10, right: 14, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => {
                const abs = Math.abs(v);
                if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
                if (abs >= 1000) return `R$ ${Math.round(v / 1000)}k`;
                return `R$ ${v}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {selectedOptions.map((opt, idx) => (
              <Bar
                key={opt.key}
                dataKey={opt.key}
                stackId="sel"
                fill={idx === 0 ? "hsl(var(--chart-red))" : hashToColor(opt.key)}
                maxBarSize={34}
                radius={idx === selectedOptions.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}

            <Line
              type="monotone"
              dataKey="receita"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={false}
            />

            {showPE && (
              <Line
                type="monotone"
                dataKey="pe"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                connectNulls
                name="Ponto de Equilíbrio"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
