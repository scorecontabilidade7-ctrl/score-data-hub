"""
Camada Gold — tabelas agregadas e views prontas para o React.
Otimizadas para leitura rápida pelo frontend.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Date
from config.database import Base


class GoldHeadcountDept(Base):
    """Headcount ativo por departamento — atualizado a cada run."""
    __tablename__ = "headcount_dept"
    __table_args__ = {"schema": "gold"}

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    departamento_id     = Column(String(100))
    departamento_nome   = Column(String(200))
    total_ativos        = Column(Integer, default=0)
    total_afastados     = Column(Integer, default=0)
    total_ferias        = Column(Integer, default=0)
    total_geral         = Column(Integer, default=0)
    refreshed_at        = Column(DateTime, default=datetime.utcnow)


class GoldDistribuicaoDisc(Base):
    """Distribuição de perfis DISC por departamento."""
    __tablename__ = "distribuicao_disc"
    __table_args__ = {"schema": "gold"}

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    departamento_nome   = Column(String(200))
    perfil_dominante    = Column(String(50))
    quantidade          = Column(Integer, default=0)
    percentual          = Column(Numeric(5, 2))
    refreshed_at        = Column(DateTime, default=datetime.utcnow)


class GoldMapaTalentos(Base):
    """
    Mapa de talentos — cada colaborador com seus scores
    de perfil, energia e satisfação. Base para o 9-box do React.
    """
    __tablename__ = "mapa_talentos"
    __table_args__ = {"schema": "gold"}

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    colaborador_id      = Column(String(100))
    colaborador_nome    = Column(String(200))
    cargo_nome          = Column(String(200))
    departamento_nome   = Column(String(200))
    perfil_dominante    = Column(String(50))
    nivel_energia       = Column(Numeric(5, 2))
    indice_satisfacao   = Column(Numeric(5, 2))
    tempo_empresa_meses = Column(Integer)
    refreshed_at        = Column(DateTime, default=datetime.utcnow)


class GoldKpisRh(Base):
    """KPIs gerais de RH — snapshot do momento da execução."""
    __tablename__ = "kpis_rh"
    __table_args__ = {"schema": "gold"}

    id                      = Column(Integer, primary_key=True, autoincrement=True)
    total_colaboradores     = Column(Integer, default=0)
    total_ativos            = Column(Integer, default=0)
    total_afastados         = Column(Integer, default=0)
    total_ferias            = Column(Integer, default=0)
    admissoes_mes_atual     = Column(Integer, default=0)
    perc_profiler_aplicado  = Column(Numeric(5, 2))
    perc_ativos             = Column(Numeric(5, 2))
    refreshed_at            = Column(DateTime, default=datetime.utcnow)
