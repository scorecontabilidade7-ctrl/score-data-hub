import { Card } from "@/components/ui/card";
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { monthlyComposedData, formatBRL } from "@/lib/finance-utils";
import type { MovimentacaoFinanceira, DateField } from "@/hooks/useFinanceData";
import { useMemo } from "react";

interface MonthlyChartProps {
  data: MovimentacaoFinanceira[];
  dateField: DateField;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  return (
    <div className="bg-card p-3.5 rounded-xl shadow-xl border border-border text-xs space-y-1.5">
      <p className="font-bold text-foreground text-sm">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm bg-muted inline-block" />
        <span className="text-muted-foreground">Receita:</span>
        <span className="tabular-nums font-semibold text-foreground">{formatBRL(entry.entradas)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "hsl(var(--primary))" }} />
        <span className="text-muted-foreground">Lucro:</span>
        <span className="tabular-nums font-semibold" style={{ color: entry.saldo >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
          {formatBRL(entry.saldo)}
        </span>
      </div>
    </div>
  );
}

export function MonthlyChart({ data, dateField }: MonthlyChartProps) {
  const chartData = monthlyComposedData(data, dateField);

  const { avgEntradas, avgSaldo } = useMemo(() => {
    if (!chartData.length) return { avgEntradas: 0, avgSaldo: 0 };
    const sumE = chartData.reduce((s, d) => s + d.entradas, 0);
    const sumS = chartData.reduce((s, d) => s + d.saldo, 0);
    return { avgEntradas: sumE / chartData.length, avgSaldo: sumS / chartData.length };
  }, [chartData]);

  return (
    <Card className="p-6 border-0 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.1em] text-foreground uppercase mb-3">
            DETALHES MENSAIS
          </h3>
          <div className="flex items-baseline gap-6">
            <div>
              <p className="text-xl font-extrabold tabular-nums text-foreground">{formatBRL(avgEntradas)}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Média Receita</p>
            </div>
            <div>
              <p className={`text-xl font-extrabold tabular-nums ${avgSaldo >= 0 ? "text-success" : "text-destructive"}`}>
                {formatBRL(avgSaldo)}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Média Lucro</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-muted inline-block" /> Receita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(var(--primary))" }} /> Lucro
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
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
          <ReferenceLine
            y={avgEntradas}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="6 4"
            strokeWidth={1}
            label={{ value: `Mé: ${formatBRL(avgEntradas)}`, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <Bar dataKey="entradas" name="Receita" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="saldoPositive" name="Lucro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
