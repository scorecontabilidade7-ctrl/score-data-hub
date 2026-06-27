import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/finance-utils";
import type { MovimentacaoFinanceira, DateField } from "@/hooks/useFinanceData";
import { useMemo, useState } from "react";

type SortKey = "date" | "valorCaixa" | "valorExtrato" | "valorPendente" | "status";
type SortDirection = "asc" | "desc";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

interface ExtratoTableProps {
  data: MovimentacaoFinanceira[];
  dateField: DateField;
}

interface DailyAgg {
  date: string;
  valorCaixa: number;
  valorExtrato: number;
  valorPendente: number;
  status: "CONCILIADO" | "NÃO CONCILIADO";
}

function aggregateByDate(data: MovimentacaoFinanceira[], dateField: DateField): DailyAgg[] {
  const map = new Map<string, { caixa: number; extrato: number }>();
  data.forEach((d) => {
    const raw = d[dateField] as string | null;
    if (!raw) return;
    const date = raw.slice(0, 10);
    const existing = map.get(date) || { caixa: 0, extrato: 0 };
    existing.caixa += d.valor_liquido ?? 0;
    existing.extrato += d.valor_liquido ?? 0;
    map.set(date, existing);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { caixa, extrato }]) => {
      const pendente = caixa - extrato;
      return {
        date,
        valorCaixa: caixa,
        valorExtrato: extrato,
        valorPendente: pendente,
        status: Math.abs(pendente) < 0.01 ? "CONCILIADO" as const : "NÃO CONCILIADO" as const,
      };
    });
}

export function ExtratoTable({ data, dateField }: ExtratoTableProps) {
  const dailyData = useMemo(() => aggregateByDate(data, dateField), [data, dateField]);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: "date", direction: "desc" });

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const sortedDailyData = useMemo(() => {
    return [...dailyData].sort((a, b) => {
      const mod = sortConfig.direction === "asc" ? 1 : -1;
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * mod;
      }
      return String(valA).localeCompare(String(valB)) * mod;
    });
  }, [dailyData, sortConfig]);

  const saldoExtrato = useMemo(() => data.reduce((s, d) => s + (d.valor_liquido ?? 0), 0), [data]);
  const saldoCaixa = saldoExtrato;
  const diasPendencia = useMemo(() => dailyData.filter((d) => d.status === "NÃO CONCILIADO").length, [dailyData]);
  const pendenciaTotal = useMemo(
    () => dailyData.reduce((s, d) => s + Math.abs(d.valorPendente), 0),
    [dailyData]
  );

  const pendingDays = useMemo(
    () =>
      dailyData
        .filter((d) => Math.abs(d.valorPendente) > 0.01)
        .sort((a, b) => Math.abs(b.valorPendente) - Math.abs(a.valorPendente))
        .slice(0, 5)
        .map((d) => ({
          date: new Date(d.date).toLocaleDateString("pt-BR"),
          value: d.valorPendente,
        })),
    [dailyData]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-center">
            <p className="text-[11px] text-muted-foreground mb-1">Dias com Pendência</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {diasPendencia > 0 ? diasPendencia : "- -"}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-center">
            <p className="text-[11px] text-muted-foreground mb-1">Pendência no período</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{formatBRL(pendenciaTotal)}</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-center">
            <p className="text-[11px] text-muted-foreground mb-1">Saldo do extrato</p>
            <p className={`text-lg font-bold tabular-nums ${saldoExtrato >= 0 ? "text-foreground" : "text-destructive"}`}>
              {formatBRL(saldoExtrato)}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-center">
            <p className="text-[11px] text-muted-foreground mb-1">Saldo do caixa</p>
            <p className={`text-lg font-bold tabular-nums ${saldoCaixa >= 0 ? "text-foreground" : "text-destructive"}`}>
              {formatBRL(saldoCaixa)}
            </p>
          </Card>
        </div>

        <Card className="p-4 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <p className="text-[11px] text-muted-foreground mb-3">Dias com valor pendente</p>
          {pendingDays.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pendingDays} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v: number) => formatBRL(v)}
                    style={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  />
                  {pendingDays.map((_, i) => (
                    <Cell key={i} fill="hsl(var(--chart-red))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma pendência</p>
          )}
        </Card>
      </div>

      <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">Extrato Bancário</h3>
        </div>
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-[11px] font-bold text-primary-foreground cursor-pointer select-none" onClick={() => handleSort("date")}>
                  DATA {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-right text-[11px] font-bold text-primary-foreground cursor-pointer select-none" onClick={() => handleSort("valorCaixa")}>
                  VALOR CAIXA {sortConfig.key === "valorCaixa" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-right text-[11px] font-bold text-primary-foreground cursor-pointer select-none" onClick={() => handleSort("valorExtrato")}>
                  VALOR EXTRATO {sortConfig.key === "valorExtrato" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-right text-[11px] font-bold text-primary-foreground cursor-pointer select-none" onClick={() => handleSort("valorPendente")}>
                  VALOR PENDENTE {sortConfig.key === "valorPendente" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold text-primary-foreground cursor-pointer select-none" onClick={() => handleSort("status")}>
                  STATUS {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDailyData.map((row, idx) => (
                <TableRow key={idx} className={idx % 2 === 0 ? "bg-primary/5" : ""}>
                  <TableCell className="text-xs tabular-nums text-foreground">
                    {new Date(row.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className={`text-right text-xs tabular-nums font-medium ${row.valorCaixa >= 0 ? "text-foreground" : "text-destructive"}`}>
                    {formatBRL(row.valorCaixa)}
                  </TableCell>
                  <TableCell className={`text-right text-xs tabular-nums font-medium ${row.valorExtrato >= 0 ? "text-foreground" : "text-destructive"}`}>
                    {formatBRL(row.valorExtrato)}
                  </TableCell>
                  <TableCell className={`text-right text-xs tabular-nums font-medium ${Math.abs(row.valorPendente) < 0.01 ? "text-foreground" : "text-destructive"}`}>
                    {formatBRL(row.valorPendente)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-[10px] font-bold px-2 ${
                      row.status === "CONCILIADO"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-yellow-500 text-white hover:bg-yellow-500/90"
                    }`}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
