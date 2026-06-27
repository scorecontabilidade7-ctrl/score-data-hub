import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildDFCMatrixExpanded, DFC_CATEGORIES, getSortedMonths, formatBRL, type DFCRow } from "@/lib/finance-utils";
import type { MovimentacaoFinanceira, DateField, RegimeType } from "@/hooks/useFinanceData";
import { cn } from "@/lib/utils";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface DFCMatrixProps {
  data: MovimentacaoFinanceira[];
  dateField: DateField;
  regime: RegimeType;
}

const ALL_MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function DFCMatrix({ data, dateField, regime }: DFCMatrixProps) {
  const availableMonths = useMemo(() => getSortedMonths(data, dateField), [data, dateField]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAH, setShowAH] = useState(true);
  const [showAV, setShowAV] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());

  const years = useMemo(() => {
    const ys = new Set<string>();
    availableMonths.forEach((m) => ys.add(m.split("/")[1]));
    return Array.from(ys).sort();
  }, [availableMonths]);

  const currentYear = years[years.length - 1] || new Date().getFullYear().toString();
  const [visibleYear, setVisibleYear] = useState(currentYear);

  // Keep visibleYear in sync if currentYear changes (e.g. on data load)
  useEffect(() => {
    setVisibleYear(currentYear);
  }, [currentYear]);

  // When available months change, reset selected to all available in the visible year
  useEffect(() => {
    const monthsInYear = availableMonths.filter((m) => m.endsWith(`/${visibleYear}`));
    setSelectedMonths(new Set(monthsInYear));
  }, [availableMonths, visibleYear]);

  const monthTabs = ALL_MONTHS.map((m) => {
    const key = `${m}/${visibleYear}`;
    const hasData = availableMonths.includes(key);
    const selected = selectedMonths.has(key);
    return { key, label: m, hasData, selected };
  });

  const activeMonths = availableMonths.filter(
    (m) => m.endsWith(`/${visibleYear}`) && selectedMonths.has(m)
  );

  function toggleMonth(key: string, hasData: boolean) {
    if (!hasData) return;
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't deselect the last one
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectAllMonths() {
    const monthsInYear = availableMonths.filter((m) => m.endsWith(`/${visibleYear}`));
    setSelectedMonths(new Set(monthsInYear));
  }
  const allRows = useMemo(() => buildDFCMatrixExpanded(data, activeMonths, dateField), [data, activeMonths, dateField]);

  const baseByMonth = useMemo(() => {
    const fat = allRows.find((r) => r.key === DFC_CATEGORIES.faturamento);
    const values = fat?.values ?? {};
    const map: Record<string, number> = {};
    activeMonths.forEach((m) => {
      map[m] = values[m] ?? 0;
    });
    return map;
  }, [allRows, activeMonths]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const keys = allRows.filter((r) => r.childKeys && r.childKeys.length > 0).map((r) => r.key);
    setExpanded(new Set(keys));
  }, [allRows]);

  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  function getAH(currentVal: number, prevVal: number): { text: string; positive: boolean } | null {
    if (prevVal === 0) return null;
    const pct = ((currentVal - prevVal) / Math.abs(prevVal)) * 100;
    return { text: `${Math.abs(pct).toFixed(1)}%`, positive: pct >= 0 };
  }

  const isVisible = (row: DFCRow): boolean => {
    if (row.level <= 0 || row.isSubtotal) return true;
    const parts = row.key.split("__");
    if (row.level === 1) return expanded.has(parts[0]);
    if (row.level === 2) return expanded.has(parts[0]) && expanded.has(`${parts[0]}__${parts[1]}`);
    return true;
  };

  const hasExpandableRows = allRows.some((r) => r.childKeys && r.childKeys.length > 0);
  const matrixTitle = regime === "caixa"
    ? "DFC - Demonstração de Fluxo de Caixa"
    : "DRE - Demonstração do Resultado do Exercício";

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Year selector */}
        {years.length > 1 && (
          <div className="flex gap-0 shrink-0">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setVisibleYear(y)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold border border-border transition-colors",
                  visibleYear === y
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground hover:bg-accent"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {/* Month tabs — clickable */}
        <div className="flex gap-0 overflow-x-auto flex-1 min-w-0">
          {monthTabs.map(({ key, label, hasData, selected }) => (
            <button
              key={key}
              onClick={() => toggleMonth(key, hasData)}
              disabled={!hasData}
              title={!hasData ? "Sem dados" : selected ? "Clique para remover" : "Clique para incluir"}
              className={cn(
                "px-3 py-1.5 text-xs font-medium border border-border whitespace-nowrap transition-colors",
                !hasData && "bg-card text-muted-foreground/40 cursor-default",
                hasData && selected && "bg-primary text-primary-foreground border-primary",
                hasData && !selected && "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Limpar/Selecionar todos */}
        <button
          onClick={selectAllMonths}
          className="text-[10px] px-2 py-1 rounded border border-border bg-card text-muted-foreground hover:bg-accent transition-colors shrink-0"
        >
          Todos
        </button>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setShowAH((v) => !v)}
            className={cn(
              "text-[10px] px-2 py-1 rounded border transition-colors",
              showAH ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-accent"
            )}
          >
            AH
          </button>
          <button
            onClick={() => setShowAV((v) => !v)}
            className={cn(
              "text-[10px] px-2 py-1 rounded border transition-colors",
              showAV ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-accent"
            )}
          >
            AV
          </button>
        </div>
        {hasExpandableRows && (
          <div className="flex gap-1 ml-3 flex-shrink-0">
            <button onClick={expandAll} className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors">
              Expandir tudo
            </button>
            <button onClick={collapseAll} className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors">
              Recolher tudo
            </button>
          </div>
        )}
      </div>

      <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">{matrixTitle}</h3>
        </div>
        <div className="w-full overflow-x-auto pb-4">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead rowSpan={2} className="sticky left-0 bg-muted z-10 min-w-[380px] text-xs font-bold text-foreground border-r border-border">
                    Competência
                  </TableHead>
                  {activeMonths.map((m) => (
                    <TableHead
                      key={m}
                      colSpan={1 + (showAH ? 1 : 0) + (showAV ? 1 : 0)}
                      className="text-center text-xs font-bold text-foreground border-x border-border"
                    >
                      {m}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/30">
                  {activeMonths.map((m) => (
                    <React.Fragment key={`sub-${m}`}>
                      <TableHead className="text-center text-[11px] font-semibold text-muted-foreground border-x border-border min-w-[100px]">Valor</TableHead>
                      {showAH && (
                        <TableHead className="text-center text-[11px] font-semibold text-muted-foreground border-x border-border min-w-[80px]">
                          AH
                        </TableHead>
                      )}
                      {showAV && (
                        <TableHead className="text-center text-[11px] font-semibold text-muted-foreground border-x border-border min-w-[80px]">
                          AV
                        </TableHead>
                      )}
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRows.filter(isVisible).map((row) => {
                  const hasChildren = row.childKeys && row.childKeys.length > 0;
                  const isOpen = expanded.has(row.key);
                  const indent = row.level <= 0 ? 0 : row.level;

                  return (
                    <TableRow
                      key={row.key}
                      className={cn(
                        row.isSubtotal && "bg-muted/60 font-bold border-t-2 border-border",
                        row.level === 0 && !row.isSubtotal && "bg-muted/20",
                        row.level === 2 && "bg-background/50"
                      )}
                    >
                      <TableCell
                        className={cn(
                          "sticky left-0 z-10 text-xs whitespace-nowrap border-r border-border",
                          row.isSubtotal ? "bg-muted font-bold text-primary pl-4" : "bg-card",
                          row.level === 0 && !row.isSubtotal && "bg-accent font-semibold"
                        )}
                        style={{ paddingLeft: `${16 + indent * 20}px` }}
                      >
                        <span className="flex items-center gap-1.5">
                          {hasChildren ? (
                            <button onClick={() => toggle(row.key)} className="p-0.5 rounded hover:bg-accent/50 transition-colors flex-shrink-0">
                              {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                            </button>
                          ) : (
                            !row.isSubtotal && row.level > 0 && <span className="w-4" />
                          )}
                          {row.label}
                        </span>
                      </TableCell>
                      {activeMonths.map((m, mIdx) => {
                        const val = row.values[m] ?? 0;
                        const prevMonth = mIdx > 0 ? activeMonths[mIdx - 1] : null;
                        const prevVal = prevMonth ? (row.values[prevMonth] ?? 0) : null;
                        const ah = prevVal !== null ? getAH(val, prevVal) : null;
                        const base = baseByMonth[m] ?? 0;
                        const av = base !== 0 ? (val / base) * 100 : null;

                        return (
                          <React.Fragment key={`${row.key}-${m}`}>
                            <TableCell
                              className={cn(
                                "text-right text-xs tabular-nums border-x border-border px-3",
                                row.isSubtotal && "font-bold",
                                row.level === 0 && !row.isSubtotal && "font-semibold",
                                val > 0 ? "text-success" : val < 0 ? "text-destructive" : "text-muted-foreground"
                              )}
                            >
                              {val !== 0 ? formatBRL(val) : ""}
                            </TableCell>
                            {showAH && (
                              <TableCell
                                className={cn(
                                  "text-center text-[11px] tabular-nums border-x border-border",
                                  ah?.positive ? "text-success" : "text-destructive"
                                )}
                              >
                                {ah ? <span>{ah.positive ? "▲" : "▼"} {ah.text}</span> : null}
                              </TableCell>
                            )}
                            {showAV && (
                              <TableCell
                                className={cn(
                                  "text-center text-[11px] tabular-nums border-x border-border",
                                  av !== null ? (av >= 0 ? "text-success" : "text-destructive") : "text-muted-foreground"
                                )}
                              >
                                {av !== null ? `${av.toFixed(1)}%` : null}
                              </TableCell>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}
