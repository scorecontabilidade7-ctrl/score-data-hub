import type { MovimentacaoFinanceira, DateField } from "@/hooks/useFinanceData";

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function sumByMaskPrefix(data: MovimentacaoFinanceira[], prefix: string): number {
  return data
    .filter((d) => d.dfc_mascara?.startsWith(prefix))
    .reduce((sum, d) => sum + (d.valor_liquido ?? 0), 0);
}

/** Get the date string from a row using the active date field, with null fallback */
function getDateValue(d: MovimentacaoFinanceira, dateField: DateField): string | null {
  const val = d[dateField] as string | null;
  if (val) return val;
  if (dateField === "data_competencia") return null; // will be grouped as "Sem Competência"
  return null;
}

export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${months[d.getMonth()]}/${d.getFullYear()}`;
}

export function getMonthKeyFromRow(d: MovimentacaoFinanceira, dateField: DateField): string | null {
  const val = getDateValue(d, dateField);
  if (!val) return null;
  return getMonthKey(val);
}

export function getSortedMonths(data: MovimentacaoFinanceira[], dateField: DateField = "data_pagamento"): string[] {
  const monthSet = new Set<string>();
  data.forEach((d) => {
    const key = getMonthKeyFromRow(d, dateField);
    if (key) monthSet.add(key);
  });
  return Array.from(monthSet).sort((a, b) => {
    const [mA, yA] = a.split("/");
    const [mB, yB] = b.split("/");
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return Number(yA) - Number(yB) || months.indexOf(mA) - months.indexOf(mB);
  });
}

export function isSaida(d: MovimentacaoFinanceira): boolean {
  return d.tipo_movimento === "Saída" || d.tipo_movimento === "Saida" || d.valor_liquido < 0;
}

export function groupByCategory(
  data: MovimentacaoFinanceira[],
  tipo: "Entrada" | "Saída"
): { name: string; value: number; valor_real: number }[] {
  const map = new Map<string, number>();
  data
    .filter((d) => tipo === "Entrada" ? d.tipo_movimento === "Entrada" : isSaida(d))
    .forEach((d) => {
      const cat = d.categoria_lancamento || "Outros";
      map.set(cat, (map.get(cat) ?? 0) + (d.valor_liquido ?? 0));
    });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.abs(value), valor_real: value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export function monthlyNetResult(data: MovimentacaoFinanceira[], dateField: DateField = "data_pagamento"): { month: string; value: number }[] {
  const map = new Map<string, number>();
  data.forEach((d) => {
    const key = getMonthKeyFromRow(d, dateField);
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + (d.valor_liquido ?? 0));
  });
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return Array.from(map.entries())
    .sort((a, b) => {
      const [mA, yA] = a[0].split("/");
      const [mB, yB] = b[0].split("/");
      return Number(yA) - Number(yB) || months.indexOf(mA) - months.indexOf(mB);
    })
    .map(([month, value]) => ({ month, value }));
}

// ---- BI Chart Utilities ----

export function monthlyComposedData(data: MovimentacaoFinanceira[], dateField: DateField = "data_pagamento"): { month: string; entradas: number; saidas: number; saldo: number; saldoPositive: number }[] {
  const mapE = new Map<string, number>();
  const mapS = new Map<string, number>();
  data.forEach((d) => {
    const key = getMonthKeyFromRow(d, dateField);
    if (!key) return;
    if (d.tipo_movimento === "Entrada") {
      mapE.set(key, (mapE.get(key) ?? 0) + (d.valor_liquido ?? 0));
    } else if (isSaida(d)) {
      mapS.set(key, (mapS.get(key) ?? 0) + (d.valor_liquido ?? 0));
    }
  });
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const allMonths = new Set([...mapE.keys(), ...mapS.keys()]);
  return Array.from(allMonths)
    .sort((a, b) => {
      const [mA, yA] = a.split("/");
      const [mB, yB] = b.split("/");
      return Number(yA) - Number(yB) || months.indexOf(mA) - months.indexOf(mB);
    })
    .map((month) => {
      const entradas = mapE.get(month) ?? 0;
      const saidasReal = mapS.get(month) ?? 0;
      const saldo = entradas + saidasReal;
      return { month, entradas, saidas: Math.abs(saidasReal), saldo, saldoPositive: Math.max(0, saldo) };
    });
}

export function groupByDfcGrupo(data: MovimentacaoFinanceira[], tipo: "Entrada" | "Saída"): { name: string; value: number }[] {
  const map = new Map<string, number>();
  data
    .filter((d) => tipo === "Entrada" ? d.tipo_movimento === "Entrada" : isSaida(d))
    .forEach((d) => {
      const grupo = (d.dfc_grupo as string) || "Outros";
      map.set(grupo, (map.get(grupo) ?? 0) + Math.abs(d.valor_liquido ?? 0));
    });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function groupByFormaPagamento(data: MovimentacaoFinanceira[]): { name: string; entradas: number; saidas: number }[] {
  const map = new Map<string, { entradas: number; saidas: number }>();
  data.forEach((d) => {
    const forma = (d.forma_pagamento as string) || "Outros";
    if (!map.has(forma)) map.set(forma, { entradas: 0, saidas: 0 });
    const entry = map.get(forma)!;
    if (d.tipo_movimento === "Entrada") {
      entry.entradas += d.valor_liquido ?? 0;
    } else if (isSaida(d)) {
      entry.saidas += Math.abs(d.valor_liquido ?? 0);
    }
  });
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, entradas: v.entradas, saidas: v.saidas }))
    .sort((a, b) => (b.entradas + b.saidas) - (a.entradas + a.saidas))
    .slice(0, 10);
}

// DFC category string mappings
export const DFC_CATEGORIES = {
  faturamento: "3 - Faturamento (+)",
  custosVariaveis: "4 - Custos Variáveis Total (=) (-)",
  despesasFixas: "5 - Despesas Gerais Administrativas (-)",
  investimentos: "6 - Investimentos (-)",
  resultadoNaoOp: "7 - Resultado Não Operacionais (+) (-)",
} as const;

export const DFC_SUBTOTALS = {
  margemContribuicao: "Margem de Contribuição (=)",
  lucroOpAntesInvest: "Lucro Oper. Antes Invest. (=)",
  lucroOperacional: "Lucro Operacional (=)",
  lucroLiquido: "Lucro Líquido (=)",
} as const;

function sumByMaskAndMonth(data: MovimentacaoFinanceira[], maskIncludes: string, month: string, dateField: DateField = "data_pagamento"): number {
  return data
    .filter((d) => d.dfc_mascara?.includes(maskIncludes) && getMonthKeyFromRow(d, dateField) === month)
    .reduce((s, d) => s + (d.valor_liquido ?? 0), 0);
}

export function sumByMaskIncludesTotal(data: MovimentacaoFinanceira[], maskIncludes: string): number {
  return data
    .filter((d) => d.dfc_mascara?.includes(maskIncludes))
    .reduce((s, d) => s + (d.valor_liquido ?? 0), 0);
}

export function computeDFCTotals(data: MovimentacaoFinanceira[]) {
  const fat = sumByMaskIncludesTotal(data, "3 - Faturamento");
  const custos = sumByMaskIncludesTotal(data, "4 - Custos Variáveis Total");
  const desp = sumByMaskIncludesTotal(data, "5 - Despesas Gerais Administrativas");
  const invest = sumByMaskIncludesTotal(data, "6 - Investimentos");
  const resNaoOp = sumByMaskIncludesTotal(data, "7 - Resultado Não Operacionais");

  const margemContribuicao = fat + custos;
  const lucroOpAntesInvest = margemContribuicao + desp;
  const lucroOperacional = lucroOpAntesInvest + invest;
  const lucroLiquido = lucroOperacional + resNaoOp;

  return { fat, custos, desp, invest, resNaoOp, margemContribuicao, lucroOpAntesInvest, lucroOperacional, lucroLiquido };
}

export interface DFCRow {
  label: string;
  level: number;
  isSubtotal: boolean;
  values: Record<string, number>;
  childKeys?: string[];
  key: string;
  _children?: DFCRow[];
}

function buildChildRows(
  data: MovimentacaoFinanceira[],
  maskIncludes: string,
  months: string[],
  groupField: "categoria_macro" | "categoria_lancamento",
  level: number,
  parentKey: string,
  dateField: DateField = "data_pagamento"
): DFCRow[] {
  const filtered = data.filter((d) => d.dfc_mascara?.includes(maskIncludes));
  const groups = new Map<string, MovimentacaoFinanceira[]>();
  filtered.forEach((d) => {
    const key = (d[groupField] as string) || "Outros";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  });

  const rows: DFCRow[] = [];
  Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([groupName, items]) => {
      const values: Record<string, number> = {};
      months.forEach((m) => {
        values[m] = items
          .filter((d) => getMonthKeyFromRow(d, dateField) === m)
          .reduce((s, d) => s + (d.valor_liquido ?? 0), 0);
      });
      const rowKey = `${parentKey}__${groupName}`;
      
      if (level === 1) {
        const subGroups = new Map<string, MovimentacaoFinanceira[]>();
        items.forEach((d) => {
          const k = d.categoria_lancamento || "Outros";
          if (!subGroups.has(k)) subGroups.set(k, []);
          subGroups.get(k)!.push(d);
        });
        const childKeys: string[] = [];
        const childRows: DFCRow[] = [];
        Array.from(subGroups.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([catName, catItems]) => {
            const catValues: Record<string, number> = {};
            months.forEach((m) => {
              catValues[m] = catItems
                .filter((d) => getMonthKeyFromRow(d, dateField) === m)
                .reduce((s, d) => s + (d.valor_liquido ?? 0), 0);
            });
            const childKey = `${rowKey}__${catName}`;
            childKeys.push(childKey);
            childRows.push({ label: catName, level: 2, isSubtotal: false, values: catValues, key: childKey });
          });
        rows.push({ label: groupName, level: 1, isSubtotal: false, values, key: rowKey, childKeys });
        rows.push(...childRows);
      } else {
        rows.push({ label: groupName, level, isSubtotal: false, values, key: rowKey });
      }
    });
  return rows;
}

export function buildDFCMatrixExpanded(data: MovimentacaoFinanceira[], months: string[], dateField: DateField = "data_pagamento") {
  const maskConfigs = [
    { mask: DFC_CATEGORIES.faturamento, search: "3 - Faturamento" },
    { mask: DFC_CATEGORIES.custosVariaveis, search: "4 - Custos Variáveis Total" },
    { mask: DFC_CATEGORIES.despesasFixas, search: "5 - Despesas Gerais Administrativas" },
    { mask: DFC_CATEGORIES.investimentos, search: "6 - Investimentos" },
    { mask: DFC_CATEGORIES.resultadoNaoOp, search: "7 - Resultado Não Operacionais" },
  ];

  const topRows: Record<string, DFCRow> = {};
  maskConfigs.forEach(({ mask, search }) => {
    const values: Record<string, number> = {};
    months.forEach((m) => { values[m] = sumByMaskAndMonth(data, search, m, dateField); });
    const children = buildChildRows(data, search, months, "categoria_macro", 1, mask, dateField);
    topRows[mask] = {
      label: mask,
      level: 0,
      isSubtotal: false,
      values,
      key: mask,
      childKeys: children.filter((c) => c.level === 1).map((c) => c.key),
    };
    topRows[mask]._children = children;
  });

  const makeSubtotal = (label: string, fn: (m: string) => number): DFCRow => {
    const values: Record<string, number> = {};
    months.forEach((m) => { values[m] = fn(m); });
    return { label, level: -1, isSubtotal: true, values, key: label };
  };

  const fat = topRows[DFC_CATEGORIES.faturamento];
  const custos = topRows[DFC_CATEGORIES.custosVariaveis];
  const desp = topRows[DFC_CATEGORIES.despesasFixas];
  const invest = topRows[DFC_CATEGORIES.investimentos];
  const resNaoOp = topRows[DFC_CATEGORIES.resultadoNaoOp];

  const margem = makeSubtotal(DFC_SUBTOTALS.margemContribuicao, (m) => fat.values[m] + custos.values[m]);
  const lucroOpAntes = makeSubtotal(DFC_SUBTOTALS.lucroOpAntesInvest, (m) => margem.values[m] + desp.values[m]);
  const lucroOp = makeSubtotal(DFC_SUBTOTALS.lucroOperacional, (m) => lucroOpAntes.values[m] + invest.values[m]);
  const lucroLiq = makeSubtotal(DFC_SUBTOTALS.lucroLiquido, (m) => lucroOp.values[m] + resNaoOp.values[m]);

  const allRows: DFCRow[] = [
    fat, ...(fat as any)._children,
    custos, ...(custos as any)._children,
    margem,
    desp, ...(desp as any)._children,
    lucroOpAntes,
    invest, ...(invest as any)._children,
    lucroOp,
    resNaoOp, ...(resNaoOp as any)._children,
    lucroLiq,
  ];

  allRows.forEach((r) => delete (r as any)._children);

  return allRows;
}
