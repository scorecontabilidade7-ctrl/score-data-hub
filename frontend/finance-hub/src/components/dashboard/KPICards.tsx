import { Card } from "@/components/ui/card";
import { formatBRL, computeDFCTotals, getMonthKeyFromRow, sumByMaskIncludesTotal } from "@/lib/finance-utils";
import type { MovimentacaoFinanceira, DateField } from "@/hooks/useFinanceData";
import { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";

interface KPICardsProps {
  data: MovimentacaoFinanceira[];
  allData: MovimentacaoFinanceira[];
  dateField: DateField;
}

function getSparkBars(
  allData: MovimentacaoFinanceira[],
  formulaFn: (subset: MovimentacaoFinanceira[]) => number,
  dateField: DateField
) {
  if (!allData || !allData.length) return [];
  const monthMap = new Map<string, MovimentacaoFinanceira[]>();
  allData.forEach((d) => {
    const key = getMonthKeyFromRow(d, dateField);
    if (!key) return;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(d);
  });
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return Array.from(monthMap.entries())
    .sort((a, b) => {
      const [mA, yA] = a[0].split("/");
      const [mB, yB] = b[0].split("/");
      return Number(yA) - Number(yB) || months.indexOf(mA) - months.indexOf(mB);
    })
    .map(([, subset]) => ({ value: Math.abs(formulaFn(subset)) }));
}

export function KPICards({ data, allData, dateField }: KPICardsProps) {
  const totals = useMemo(() => computeDFCTotals(data), [data]);

  const KPI_CONFIG = [
    { label: "FATURAMENTO", value: totals.fat, maskSearch: "3 - Faturamento", isHighlight: true },
    { label: "CUSTOS VARIÁVEIS", value: totals.custos, maskSearch: "4 - Custos Variáveis Total" },
    { label: "MARGEM CONTRIBUIÇÃO", value: totals.margemContribuicao, isCalculated: true },
    { label: "DESPESAS FIXAS", value: totals.desp, maskSearch: "5 - Despesas Gerais Administrativas" },
    { label: "LUCRO OPER.", value: totals.lucroOpAntesInvest, isCalculated: true },
    { label: "INVESTIMENTOS", value: totals.invest, maskSearch: "6 - Investimentos" },
    { label: "RES. NÃO OPER.", value: totals.resNaoOp, maskSearch: "7 - Resultado Não Operacionais" },
    { label: "LUCRO LÍQUIDO", value: totals.lucroLiquido, isCalculated: true },
  ];

  const faturamento = totals.fat;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_CONFIG.map(({ label, value, maskSearch, isHighlight, isCalculated }) => {
        const sparkData = maskSearch
          ? getSparkBars(allData, (subset) => sumByMaskIncludesTotal(subset, maskSearch), dateField)
          : [];

        const pctFaturamento = faturamento !== 0 ? ((value / faturamento) * 100) : 0;
        const isNegative = value < 0;

        const barColor = isHighlight
          ? "hsl(var(--primary-foreground))"
          : "hsl(var(--primary))";

        return (
          <Card
            key={label}
            className={`relative overflow-hidden border-0 rounded-xl transition-shadow hover:shadow-md ${
              isHighlight
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-card shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
            }`}
          >
            <div className="p-4 pb-2">
              <p className={`text-[10px] font-bold tracking-[0.1em] mb-1.5 ${
                isHighlight ? "text-primary-foreground/70" : "text-primary"
              }`}>
                {label}
              </p>
              <div className="flex items-baseline gap-2">
                <p className={`text-xl font-extrabold tabular-nums tracking-tight ${
                  isHighlight
                    ? "text-primary-foreground"
                    : isNegative
                    ? "text-destructive"
                    : "text-foreground"
                }`}>
                  {formatBRL(Math.abs(value))}
                </p>
                {!isHighlight && (
                  <span className={`text-[10px] font-semibold ${
                    isNegative ? "text-destructive" : "text-success"
                  }`}>
                    {pctFaturamento >= 0 ? "↑" : "↓"} {Math.abs(pctFaturamento).toFixed(1)}%
                  </span>
                )}
              </div>
              {!isHighlight && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  % do Faturamento
                </p>
              )}
            </div>
            {sparkData.length > 1 && (
              <div className="h-10 px-2 pb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sparkData} barCategoryGap="20%">
                    <Bar
                      dataKey="value"
                      fill={barColor}
                      radius={[2, 2, 0, 0]}
                      opacity={isHighlight ? 0.4 : 0.25}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
