import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/supabase/external-client";

export type OrcamentoTipo = "dre" | "dfc";

// DFC rows são armazenados com o prefixo "dfc::" em dfc_mascara.
// Isso evita alterar o schema existente e mantém retrocompatibilidade com os dados de DRE.
const DFC_PREFIX = "dfc::";

export interface OrcamentoRow {
  id?: number;
  ano: number;
  mes: number;
  dfc_mascara: string;
  categoria_macro: string;
  categoria_lancamento: string;
  valor_previsto: number;
}

export type OrcamentoMap = Map<string, number>;

/** Chave única para lookup no mapa (sem prefixo, independente do tipo) */
export function orcamentoKey(
  ano: number,
  mes: number,
  dfcMascara: string,
  categoriaMacro: string,
  categoriaLancamento: string
): string {
  return `${ano}|${mes}|${dfcMascara}|${categoriaMacro}|${categoriaLancamento}`;
}

/** Converte mês no formato "jan/2025" para { mes: 1, ano: 2025 } */
export function parseMonthKey(monthKey: string): { mes: number; ano: number } {
  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [mStr, yStr] = monthKey.split("/");
  return { mes: monthNames.indexOf(mStr) + 1, ano: Number(yStr) };
}

/** Adiciona ou remove o prefixo "dfc::" conforme o tipo */
export function encodeMascara(mascara: string, tipo: OrcamentoTipo): string {
  return tipo === "dfc" ? `${DFC_PREFIX}${mascara}` : mascara;
}

function stripPrefix(mascara: string): string {
  return mascara.startsWith(DFC_PREFIX) ? mascara.slice(DFC_PREFIX.length) : mascara;
}

function queryKey(ano: number, tipo: OrcamentoTipo) {
  return ["orcamento_previsto", ano, tipo];
}

export function useOrcamento(ano: number, tipo: OrcamentoTipo = "dre") {
  return useQuery<OrcamentoRow[]>({
    queryKey: queryKey(ano, tipo),
    queryFn: async () => {
      let query = externalSupabase
        .from("orcamento_previsto")
        .select("*")
        .eq("ano", ano)
        .order("mes");

      if (tipo === "dfc") {
        query = query.like("dfc_mascara", `${DFC_PREFIX}%`);
      } else {
        query = query.not("dfc_mascara", "like", `${DFC_PREFIX}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as OrcamentoRow[]) ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Constrói Map de lookup com dfc_mascara sem prefixo (igual ao que orcamentoKey produz) */
export function buildOrcamentoMap(rows: OrcamentoRow[]): OrcamentoMap {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const mascaraNorm = stripPrefix(r.dfc_mascara);
    const k = orcamentoKey(r.ano, r.mes, mascaraNorm, r.categoria_macro, r.categoria_lancamento);
    map.set(k, r.valor_previsto);
  });
  return map;
}

export function useUpsertOrcamento(ano: number, tipo: OrcamentoTipo = "dre") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (row: OrcamentoRow) => {
      const { error } = await externalSupabase
        .from("orcamento_previsto")
        .upsert(
          {
            ano: row.ano,
            mes: row.mes,
            dfc_mascara: encodeMascara(row.dfc_mascara, tipo),
            categoria_macro: row.categoria_macro,
            categoria_lancamento: row.categoria_lancamento,
            valor_previsto: row.valor_previsto,
          },
          { onConflict: "ano,mes,dfc_mascara,categoria_macro,categoria_lancamento" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(ano, tipo) });
    },
  });
}
