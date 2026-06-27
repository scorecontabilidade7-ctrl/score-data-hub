import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildDFCMatrixExpanded, DFC_CATEGORIES, getSortedMonths, formatBRL, type DFCRow } from "@/lib/finance-utils";
import type { MovimentacaoFinanceira, DateField } from "@/hooks/useFinanceData";
import {
  useOrcamento,
  useUpsertOrcamento,
  buildOrcamentoMap,
  parseMonthKey,
  orcamentoKey,
  type OrcamentoMap,
  type OrcamentoTipo,
} from "@/hooks/useOrcamento";
import { cn } from "@/lib/utils";
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OrcamentoPrevistoProps {
  data: MovimentacaoFinanceira[];
  dateField: DateField;
  tipo: OrcamentoTipo;
}

const ALL_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// ─── Célula editável de "Previsto" ────────────────────────────────────────────
interface EditableCellProps {
  value: number;
  onCommit: (newValue: number) => void;
  isSaving: boolean;
}

function EditableCell({ value, onCommit, isSaving }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(value !== 0 ? String(value) : "");
    setEditing(true);
  }

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    setEditing(false);
    const parsed = parseFloat(draft.replace(",", ".").replace(/[^\d.-]/g, ""));
    const next = isNaN(parsed) ? 0 : parsed;
    if (next !== value) onCommit(next);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="w-full text-right text-xs bg-primary/10 border border-primary rounded px-1 py-0.5 focus:outline-none tabular-nums"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        type="text"
        inputMode="decimal"
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className={cn(
        "w-full text-right text-xs tabular-nums rounded px-1 py-0.5 transition-colors",
        "hover:bg-primary/10 hover:text-primary",
        value !== 0 ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"
      )}
      title="Clique para editar o valor previsto"
    >
      {isSaving ? (
        <Loader2 className="h-3 w-3 animate-spin inline" />
      ) : value !== 0 ? (
        formatBRL(value)
      ) : (
        "—"
      )}
    </button>
  );
}

// ─── Helpers de cor contextual ────────────────────────────────────────────────
function isRevenueRow(dfcMascara: string): boolean {
  return dfcMascara.startsWith("3 -");
}

function getDiffColor(diff: number, isRevenue: boolean): string {
  if (diff === 0) return "text-muted-foreground";
  const positive = isRevenue ? diff > 0 : diff < 0;
  return positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400";
}

function getDiffInfo(
  diff: number,
  previsto: number,
  isRevenue: boolean
): { label: string; pct: string | null; positive: boolean } | null {
  if (diff === 0 || previsto === 0) return null;
  const positive = isRevenue ? diff > 0 : diff < 0;
  const arrow = positive ? "▲" : "▼";
  const pct = ((Math.abs(diff) / Math.abs(previsto)) * 100).toFixed(1) + "%";
  return { label: `${arrow} ${formatBRL(Math.abs(diff))}`, pct, positive };
}

function extractMascaraFromKey(rowKey: string): string {
  return rowKey.split("__")[0];
}

function extractCategoriaMacroFromKey(rowKey: string): string {
  return rowKey.split("__")[1] ?? "";
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function OrcamentoPrevisto({ data, dateField, tipo }: OrcamentoPrevistoProps) {
  const availableMonths = useMemo(() => getSortedMonths(data, dateField), [data, dateField]);

  const currentYear = useMemo(() => {
    const years = new Set<string>();
    availableMonths.forEach((m) => years.add(m.split("/")[1]));
    const sorted = Array.from(years).sort();
    return Number(sorted[sorted.length - 1] ?? new Date().getFullYear());
  }, [availableMonths]);

  const activeMonths = useMemo(
    () => availableMonths.filter((m) => m.endsWith(`/${currentYear}`)),
    [availableMonths, currentYear]
  );

  const allRows = useMemo(
    () => buildDFCMatrixExpanded(data, activeMonths, dateField),
    [data, activeMonths, dateField]
  );

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());

  const { data: orcamentoRows = [] } = useOrcamento(currentYear, tipo);
  const orcamentoMap: OrcamentoMap = useMemo(() => buildOrcamentoMap(orcamentoRows), [orcamentoRows]);

  const { mutateAsync: upsert } = useUpsertOrcamento(currentYear, tipo);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(allRows.filter((r) => r.childKeys?.length).map((r) => r.key)));
  }, [allRows]);

  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  const isVisible = (row: DFCRow): boolean => {
    if (row.level <= 0 || row.isSubtotal) return true;
    const parts = row.key.split("__");
    if (row.level === 1) return expanded.has(parts[0]);
    if (row.level === 2) return expanded.has(parts[0]) && expanded.has(`${parts[0]}__${parts[1]}`);
    return true;
  };

  function getPrevistoForRow(row: DFCRow, monthKey: string): number {
    const { mes, ano } = parseMonthKey(monthKey);

    if (row.level === 2) {
      const dfcMascara = extractMascaraFromKey(row.key);
      const categoriaMacro = extractCategoriaMacroFromKey(row.key);
      const categoriaLancamento = row.label;
      const k = orcamentoKey(ano, mes, dfcMascara, categoriaMacro, categoriaLancamento);
      return orcamentoMap.get(k) ?? 0;
    }

    if (row.isSubtotal) return 0;

    const prefix = `${row.key}__`;
    const child2Rows = allRows.filter((r) => r.level === 2 && r.key.startsWith(prefix));
    return child2Rows.reduce((sum, child) => {
      const dfcMascara = extractMascaraFromKey(child.key);
      const categoriaMacro = extractCategoriaMacroFromKey(child.key);
      const k = orcamentoKey(ano, mes, dfcMascara, categoriaMacro, child.label);
      return sum + (orcamentoMap.get(k) ?? 0);
    }, 0);
  }

  function getPrevistoSubtotal(rowKey: string, monthKey: string): number {
    const fat = allRows.find((r) => r.key === DFC_CATEGORIES.faturamento);
    const custos = allRows.find((r) => r.key === DFC_CATEGORIES.custosVariaveis);
    const desp = allRows.find((r) => r.key === DFC_CATEGORIES.despesasFixas);
    const invest = allRows.find((r) => r.key === DFC_CATEGORIES.investimentos);
    const resNaoOp = allRows.find((r) => r.key === DFC_CATEGORIES.resultadoNaoOp);

    const p = (r?: DFCRow) => (r ? getPrevistoForRow(r, monthKey) : 0);

    const margemContribuicao = p(fat) + p(custos);
    const lucroOpAntes = margemContribuicao + p(desp);
    const lucroOp = lucroOpAntes + p(invest);
    const lucroLiq = lucroOp + p(resNaoOp);

    switch (rowKey) {
      case "Margem de Contribuição (=)": return margemContribuicao;
      case "Lucro Oper. Antes Invest. (=)": return lucroOpAntes;
      case "Lucro Operacional (=)": return lucroOp;
      case "Lucro Líquido (=)": return lucroLiq;
      default: return 0;
    }
  }

  async function handleCommit(row: DFCRow, monthKey: string, newValue: number) {
    const dfcMascara = extractMascaraFromKey(row.key);
    const categoriaMacro = extractCategoriaMacroFromKey(row.key);
    const categoriaLancamento = row.label;
    const { mes, ano } = parseMonthKey(monthKey);

    const cellId = `${monthKey}|${row.key}`;
    setSavingCells((prev) => new Set(prev).add(cellId));

    try {
      await upsert({
        ano,
        mes,
        dfc_mascara: dfcMascara,
        categoria_macro: categoriaMacro,
        categoria_lancamento: categoriaLancamento,
        valor_previsto: newValue,
      });
    } catch {
      toast.error("Erro ao salvar o valor previsto.");
    } finally {
      setSavingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellId);
        return next;
      });
    }
  }

  const monthTabs = ALL_MONTHS.map((m) => {
    const key = `${m}/${currentYear}`;
    return { key, hasData: activeMonths.includes(key) };
  });

  const hasExpandableRows = allRows.some((r) => r.childKeys?.length);

  const title = tipo === "dfc"
    ? "Planejamento Orçamentário — DFC (Caixa)"
    : "Planejamento Orçamentário — DRE (Competência)";

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Month tabs + controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-0 overflow-x-auto">
          {monthTabs.map(({ key, hasData }) => (
            <div
              key={key}
              className={cn(
                "px-4 py-2 text-xs font-medium border border-border whitespace-nowrap",
                hasData
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground"
              )}
            >
              {key}
            </div>
          ))}
        </div>
        {hasExpandableRows && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={expandAll}
              className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors"
            >
              Expandir tudo
            </button>
            <button
              onClick={collapseAll}
              className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors"
            >
              Recolher tudo
            </button>
          </div>
        )}
      </div>

      <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <div className="p-4 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {title} — {currentYear}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Clique nos valores da coluna <span className="font-medium text-primary">Previsto</span> para editar. Totais são calculados automaticamente.
            </p>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead
                    rowSpan={2}
                    className="sticky left-0 bg-muted z-10 min-w-[340px] text-xs font-bold text-foreground border-r border-border"
                  >
                    Conta
                  </TableHead>
                  {activeMonths.map((m) => (
                    <TableHead
                      key={m}
                      colSpan={3}
                      className="text-center text-xs font-bold text-foreground border-x border-border"
                    >
                      {m}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/30">
                  {activeMonths.map((m) => (
                    <React.Fragment key={`sub-${m}`}>
                      <TableHead className="text-center text-[11px] font-semibold text-primary border-x border-border min-w-[110px]">
                        Previsto
                      </TableHead>
                      <TableHead className="text-center text-[11px] font-semibold text-muted-foreground border-x border-border min-w-[110px]">
                        Realizado
                      </TableHead>
                      <TableHead className="text-center text-[11px] font-semibold text-muted-foreground border-x border-border min-w-[110px]">
                        Diferença
                      </TableHead>
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {allRows.filter(isVisible).map((row) => {
                  const hasChildren = row.childKeys && row.childKeys.length > 0;
                  const isOpen = expanded.has(row.key);
                  const indent = row.level <= 0 ? 0 : row.level;
                  const isEditableLevel = row.level === 2;
                  const isRevenue = isRevenueRow(extractMascaraFromKey(row.key));

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
                            <button
                              onClick={() => toggle(row.key)}
                              className="p-0.5 rounded hover:bg-accent/50 transition-colors flex-shrink-0"
                            >
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>
                          ) : (
                            !row.isSubtotal && row.level > 0 && <span className="w-4" />
                          )}
                          {row.label}
                        </span>
                      </TableCell>

                      {activeMonths.map((m) => {
                        const realizado = row.values[m] ?? 0;
                        const previsto = row.isSubtotal
                          ? getPrevistoSubtotal(row.key, m)
                          : getPrevistoForRow(row, m);
                        const diff = realizado - previsto;
                        const diffColor = getDiffColor(diff, isRevenue);
                        const diffInfo = getDiffInfo(diff, previsto, isRevenue);
                        const cellId = `${m}|${row.key}`;
                        const isSaving = savingCells.has(cellId);

                        return (
                          <React.Fragment key={`${row.key}-${m}`}>
                            {/* PREVISTO */}
                            <TableCell className="text-right text-xs tabular-nums border-x border-border px-2 py-1">
                              {isEditableLevel ? (
                                <EditableCell
                                  value={previsto}
                                  onCommit={(v) => handleCommit(row, m, v)}
                                  isSaving={isSaving}
                                />
                              ) : (
                                <span
                                  className={cn(
                                    "tabular-nums",
                                    row.isSubtotal && "font-bold",
                                    row.level === 0 && "font-semibold",
                                    previsto > 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : previsto < 0
                                      ? "text-red-500 dark:text-red-400"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {previsto !== 0 ? formatBRL(previsto) : "—"}
                                </span>
                              )}
                            </TableCell>

                            {/* REALIZADO */}
                            <TableCell
                              className={cn(
                                "text-right text-xs tabular-nums border-x border-border px-3",
                                row.isSubtotal && "font-bold",
                                row.level === 0 && !row.isSubtotal && "font-semibold",
                                realizado > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : realizado < 0
                                  ? "text-red-500 dark:text-red-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              {realizado !== 0 ? formatBRL(realizado) : ""}
                            </TableCell>

                            {/* DIFERENÇA */}
                            <TableCell
                              className={cn(
                                "text-right text-xs tabular-nums border-x border-border px-3",
                                row.isSubtotal && "font-bold",
                                row.level === 0 && !row.isSubtotal && "font-semibold",
                                diffColor
                              )}
                            >
                              {diffInfo ? (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span>{diffInfo.label}</span>
                                  <span className="text-[10px] opacity-70 font-normal">{diffInfo.pct}</span>
                                </div>
                              ) : ""}
                            </TableCell>
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
