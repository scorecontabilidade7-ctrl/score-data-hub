"""
Camada Silver — dados limpos, normalizados e tipados.
Sem agregações — granularidade por colaborador/cargo/departamento.
"""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, DateTime, Date,
    Numeric, ForeignKey, UniqueConstraint
)
from config.database import Base


class SilverColaborador(Base):
    __tablename__ = "colaboradores"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_silver_colab_solides_id"),
        {"schema": "silver"},
    )

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    solides_id          = Column(String(100), nullable=False)
    nome                = Column(String(200))
    email               = Column(String(200))
    cpf                 = Column(String(20))
    data_nascimento     = Column(Date)
    data_admissao       = Column(Date)
    data_demissao       = Column(Date)
    status              = Column(String(50))   # ativo | afastado | férias | desligado
    genero              = Column(String(30))
    cargo_id            = Column(String(100))
    cargo_nome          = Column(String(200))
    departamento_id     = Column(String(100))
    departamento_nome   = Column(String(200))
    salario             = Column(Numeric(12, 2))
    tipo_contrato       = Column(String(50))
    processed_at        = Column(DateTime, default=datetime.utcnow)
    updated_at          = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SilverCargo(Base):
    __tablename__ = "cargos"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_silver_cargo_solides_id"),
        {"schema": "silver"},
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    solides_id      = Column(String(100), nullable=False)
    nome            = Column(String(200))
    nivel           = Column(String(100))
    area            = Column(String(200))
    ativo           = Column(String(10), default="true")
    processed_at    = Column(DateTime, default=datetime.utcnow)


class SilverDepartamento(Base):
    __tablename__ = "departamentos"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_silver_depto_solides_id"),
        {"schema": "silver"},
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    solides_id      = Column(String(100), nullable=False)
    nome            = Column(String(200))
    responsavel     = Column(String(200))
    ativo           = Column(String(10), default="true")
    processed_at    = Column(DateTime, default=datetime.utcnow)


class SilverPerfil(Base):
    __tablename__ = "perfis"
    __table_args__ = (
        UniqueConstraint("colaborador_id", name="uq_silver_perfil_colab_id"),
        {"schema": "silver"},
    )

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    colaborador_id      = Column(String(100), nullable=False)
    perfil_dominante    = Column(String(50))
    score_executor      = Column(Numeric(5, 2))
    score_comunicador   = Column(Numeric(5, 2))
    score_planejador    = Column(Numeric(5, 2))
    score_analista      = Column(Numeric(5, 2))
    nivel_energia       = Column(Numeric(5, 2))
    indice_satisfacao   = Column(Numeric(5, 2))
    data_aplicacao      = Column(Date)
    processed_at        = Column(DateTime, default=datetime.utcnow)


class SilverAjusteMotivo(Base):
    __tablename__ = "ajuste_motivos"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_silver_ajuste_motivo_id"),
        {"schema": "silver"},
    )

    id           = Column(Integer, primary_key=True, autoincrement=True)
    solides_id   = Column(String(100), nullable=False)
    descricao    = Column(String(200))
    conta_falta  = Column(String(10))
    dia_inteiro  = Column(String(10))
    absenteismo  = Column(String(10))
    ativo        = Column(String(10))
    processed_at = Column(DateTime, default=datetime.utcnow)


class SilverAjuste(Base):
    __tablename__ = "ajustes"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_silver_ajuste_id"),
        {"schema": "silver"},
    )

    id               = Column(Integer, primary_key=True, autoincrement=True)
    solides_id       = Column(String(100), nullable=False)
    colaborador_id   = Column(String(100))
    colaborador_nome = Column(String(200))
    data_inicio      = Column(Date)
    data_fim         = Column(Date)
    dia_inteiro      = Column(String(10))
    origem           = Column(String(100))
    observacao       = Column(String(500))
    motivo_id        = Column(String(100))
    motivo_descricao = Column(String(200))
    processed_at     = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SilverFeriado(Base):
    __tablename__ = "feriados"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_silver_feriado_id"),
        {"schema": "silver"},
    )

    id               = Column(Integer, primary_key=True, autoincrement=True)
    solides_id       = Column(String(100), nullable=False)
    descricao        = Column(String(200))
    data             = Column(Date)
    calendario_nome  = Column(String(200))
    ano              = Column(Integer)
    processed_at     = Column(DateTime, default=datetime.utcnow)


class SilverPonto(Base):
    __tablename__ = "pontos"
    __table_args__ = (
        UniqueConstraint("colaborador_id", "inicio_ts", name="uq_silver_ponto"),
        {"schema": "silver"},
    )

    id                   = Column(Integer, primary_key=True, autoincrement=True)
    colaborador_id       = Column(String(100), nullable=False)
    data_trabalhada      = Column(Date)
    hora_entrada         = Column(String(20))
    hora_saida           = Column(String(20))
    inicio_ts            = Column(String(50))
    segundos_trabalhados = Column(Integer)
    horas_trabalhadas    = Column(Numeric(5, 2))
    status               = Column(String(50))
    processed_at         = Column(DateTime, default=datetime.utcnow)
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
