"""
Camada Gold — Agregação
Lê Silver e gera tabelas otimizadas para consumo pelo React.
Ao final, sincroniza os dados com o projeto Supabase financeiro via SDK.
"""

import os
from datetime import datetime, date
from collections import defaultdict
from config.database import get_session
from models.silver import SilverColaborador, SilverPerfil
from models.gold import GoldHeadcountDept, GoldDistribuicaoDisc, GoldMapaTalentos, GoldKpisRh
from utils.logger import get_logger

logger = get_logger(__name__)

# ─── Supabase financeiro (projeto que o frontend lê) ───────────────────────────
_FIN_URL = os.getenv("FIN_SUPABASE_URL")
_FIN_KEY  = os.getenv("FIN_SUPABASE_KEY")

def _get_fin_client():
    try:
        from supabase import create_client
        return create_client(_FIN_URL, _FIN_KEY)
    except Exception as e:
        logger.warning(f"Supabase financeiro indisponível: {e}")
        return None


def _meses_empresa(data_admissao: date | None) -> int:
    if not data_admissao:
        return 0
    today = date.today()
    return (today.year - data_admissao.year) * 12 + (today.month - data_admissao.month)


class GoldAggregator:

    def build_headcount_dept(self) -> int:
        logger.info("Construindo gold_headcount_dept...")
        for session in get_session():
            session.query(GoldHeadcountDept).delete()
            colaboradores = session.query(SilverColaborador).all()

            buckets: dict[str, dict] = defaultdict(lambda: {
                "nome": "", "ativos": 0, "afastados": 0, "ferias": 0
            })
            for c in colaboradores:
                dep_id = c.departamento_id or "sem_departamento"
                buckets[dep_id]["nome"] = c.departamento_nome or "Sem Departamento"
                if c.status == "ativo":
                    buckets[dep_id]["ativos"] += 1
                elif c.status == "afastado":
                    buckets[dep_id]["afastados"] += 1
                elif c.status == "férias":
                    buckets[dep_id]["ferias"] += 1

            for dep_id, b in buckets.items():
                total = b["ativos"] + b["afastados"] + b["ferias"]
                session.add(GoldHeadcountDept(
                    departamento_id   = dep_id,
                    departamento_nome = b["nome"],
                    total_ativos      = b["ativos"],
                    total_afastados   = b["afastados"],
                    total_ferias      = b["ferias"],
                    total_geral       = total,
                    refreshed_at      = datetime.utcnow(),
                ))
        count = len(buckets)
        logger.info(f"Departamentos agregados: {count}")
        return count

    def build_distribuicao_disc(self) -> int:
        logger.info("Construindo gold_distribuicao_disc...")
        for session in get_session():
            session.query(GoldDistribuicaoDisc).delete()

            rows = (
                session.query(SilverColaborador, SilverPerfil)
                .outerjoin(SilverPerfil, SilverColaborador.solides_id == SilverPerfil.colaborador_id)
                .filter(SilverColaborador.status == "ativo")
                .all()
            )

            counts: dict[tuple, int] = defaultdict(int)
            dept_totals: dict[str, int] = defaultdict(int)

            for colab, perfil in rows:
                dept = colab.departamento_nome or "Sem Departamento"
                disc = perfil.perfil_dominante if perfil else "não mapeado"
                counts[(dept, disc)] += 1
                dept_totals[dept] += 1

            for (dept, disc), qty in counts.items():
                total = dept_totals[dept] or 1
                session.add(GoldDistribuicaoDisc(
                    departamento_nome = dept,
                    perfil_dominante  = disc,
                    quantidade        = qty,
                    percentual        = round(qty / total * 100, 2),
                    refreshed_at      = datetime.utcnow(),
                ))
        count = len(counts)
        logger.info(f"Distribuições DISC geradas: {count}")
        return count

    def build_mapa_talentos(self) -> int:
        logger.info("Construindo gold_mapa_talentos...")
        for session in get_session():
            session.query(GoldMapaTalentos).delete()

            rows = (
                session.query(SilverColaborador, SilverPerfil)
                .outerjoin(SilverPerfil, SilverColaborador.solides_id == SilverPerfil.colaborador_id)
                .filter(SilverColaborador.status == "ativo")
                .all()
            )

            count = 0
            for colab, perfil in rows:
                session.add(GoldMapaTalentos(
                    colaborador_id      = colab.solides_id,
                    colaborador_nome    = colab.nome,
                    cargo_nome          = colab.cargo_nome,
                    departamento_nome   = colab.departamento_nome,
                    perfil_dominante    = perfil.perfil_dominante if perfil else None,
                    nivel_energia       = perfil.nivel_energia if perfil else None,
                    indice_satisfacao   = perfil.indice_satisfacao if perfil else None,
                    tempo_empresa_meses = _meses_empresa(colab.data_admissao),
                    refreshed_at        = datetime.utcnow(),
                ))
                count += 1
        logger.info(f"Talentos mapeados: {count}")
        return count

    def build_kpis_rh(self) -> int:
        logger.info("Construindo gold_kpis_rh...")
        for session in get_session():
            session.query(GoldKpisRh).delete()

            colaboradores = session.query(SilverColaborador).all()
            perfis_count = session.query(SilverPerfil).count()

            total = len(colaboradores)
            ativos = sum(1 for c in colaboradores if c.status == "ativo")
            afastados = sum(1 for c in colaboradores if c.status == "afastado")
            ferias = sum(1 for c in colaboradores if c.status == "férias")
            hoje = date.today()
            admissoes_mes = sum(
                1 for c in colaboradores
                if c.data_admissao
                and c.data_admissao.year == hoje.year
                and c.data_admissao.month == hoje.month
            )

            session.add(GoldKpisRh(
                total_colaboradores    = total,
                total_ativos           = ativos,
                total_afastados        = afastados,
                total_ferias           = ferias,
                admissoes_mes_atual    = admissoes_mes,
                perc_profiler_aplicado = round(perfis_count / total * 100, 2) if total else 0,
                perc_ativos            = round(ativos / total * 100, 2) if total else 0,
                refreshed_at           = datetime.utcnow(),
            ))
        logger.info("KPIs de RH gerados.")
        return 1

    def sync_to_financial(self) -> bool:
        """Copia os dados gold para o projeto Supabase financeiro (onde o frontend lê)."""
        client = _get_fin_client()
        if not client:
            return False

        try:
            for session in get_session():
                # kpis_rh
                kpis = session.query(GoldKpisRh).all()
                if kpis:
                    client.table("rh_kpis_rh").delete().neq("id", 0).execute()
                    client.table("rh_kpis_rh").insert([{
                        "total_colaboradores":    k.total_colaboradores,
                        "total_ativos":           k.total_ativos,
                        "total_afastados":        k.total_afastados,
                        "total_ferias":           k.total_ferias,
                        "admissoes_mes_atual":    k.admissoes_mes_atual,
                        "perc_profiler_aplicado": float(k.perc_profiler_aplicado or 0),
                        "perc_ativos":            float(k.perc_ativos or 0),
                        "refreshed_at":           k.refreshed_at.isoformat() if k.refreshed_at else None,
                    } for k in kpis]).execute()
                    logger.info(f"Sync kpis_rh: {len(kpis)} rows")

                # headcount_dept
                hc = session.query(GoldHeadcountDept).all()
                if hc:
                    client.table("rh_headcount_dept").delete().neq("id", 0).execute()
                    client.table("rh_headcount_dept").insert([{
                        "departamento_id":   h.departamento_id,
                        "departamento_nome": h.departamento_nome,
                        "total_ativos":      h.total_ativos,
                        "total_afastados":   h.total_afastados,
                        "total_ferias":      h.total_ferias,
                        "total_geral":       h.total_geral,
                        "refreshed_at":      h.refreshed_at.isoformat() if h.refreshed_at else None,
                    } for h in hc]).execute()
                    logger.info(f"Sync headcount_dept: {len(hc)} rows")

                # distribuicao_disc
                disc = session.query(GoldDistribuicaoDisc).all()
                if disc:
                    client.table("rh_distribuicao_disc").delete().neq("id", 0).execute()
                    client.table("rh_distribuicao_disc").insert([{
                        "departamento_nome": d.departamento_nome,
                        "perfil_dominante":  d.perfil_dominante,
                        "quantidade":        d.quantidade,
                        "percentual":        float(d.percentual or 0),
                        "refreshed_at":      d.refreshed_at.isoformat() if d.refreshed_at else None,
                    } for d in disc]).execute()
                    logger.info(f"Sync distribuicao_disc: {len(disc)} rows")

                # mapa_talentos
                mapa = session.query(GoldMapaTalentos).all()
                if mapa:
                    client.table("rh_mapa_talentos").delete().neq("id", 0).execute()
                    client.table("rh_mapa_talentos").insert([{
                        "colaborador_id":      m.colaborador_id,
                        "colaborador_nome":    m.colaborador_nome,
                        "cargo_nome":          m.cargo_nome,
                        "departamento_nome":   m.departamento_nome,
                        "perfil_dominante":    m.perfil_dominante,
                        "nivel_energia":       float(m.nivel_energia or 0),
                        "indice_satisfacao":   float(m.indice_satisfacao or 0),
                        "tempo_empresa_meses": m.tempo_empresa_meses,
                        "refreshed_at":        m.refreshed_at.isoformat() if m.refreshed_at else None,
                    } for m in mapa]).execute()
                    logger.info(f"Sync mapa_talentos: {len(mapa)} rows")

            logger.info("Sync para projeto financeiro concluído.")
            return True
        except Exception as e:
            logger.error(f"Erro no sync financeiro: {e}")
            return False

    def run(self) -> dict:
        logger.info("=== GOLD: Início da agregação ===")
        result = {
            "headcount_dept":    self.build_headcount_dept(),
            "distribuicao_disc": self.build_distribuicao_disc(),
            "mapa_talentos":     self.build_mapa_talentos(),
            "kpis_rh":           self.build_kpis_rh(),
        }
        logger.info(f"=== GOLD: Agregação concluída — {result} ===")
        self.sync_to_financial()
        return result
