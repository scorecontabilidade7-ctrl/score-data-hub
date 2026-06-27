"""
Camada Bronze — dados brutos da API Sólides, sem transformação.
Armazena o JSON exatamente como veio, com metadados de ingestão.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy import UniqueConstraint
from config.database import Base


class BronzeColaborador(Base):
    __tablename__ = "colaboradores"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_bronze_colab_solides_id"),
        {"schema": "bronze"},
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    solides_id      = Column(String(100), nullable=False)
    raw_json        = Column(JSON, nullable=False)
    ingested_at     = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source          = Column(String(50), default="solides_dp")


class BronzeCargo(Base):
    __tablename__ = "cargos"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_bronze_cargo_solides_id"),
        {"schema": "bronze"},
    )

    id          = Column(Integer, primary_key=True, autoincrement=True)
    solides_id  = Column(String(100), nullable=False)
    raw_json    = Column(JSON, nullable=False)
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BronzeDepartamento(Base):
    __tablename__ = "departamentos"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_bronze_depto_solides_id"),
        {"schema": "bronze"},
    )

    id          = Column(Integer, primary_key=True, autoincrement=True)
    solides_id  = Column(String(100), nullable=False)
    raw_json    = Column(JSON, nullable=False)
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BronzePerfil(Base):
    __tablename__ = "perfis"
    __table_args__ = (
        UniqueConstraint("colaborador_id", name="uq_bronze_perfil_colab_id"),
        {"schema": "bronze"},
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    colaborador_id  = Column(String(100), nullable=False)
    raw_json        = Column(JSON, nullable=False)
    ingested_at     = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source          = Column(String(50), default="solides_gestao")


class BronzeAjusteMotivo(Base):
    __tablename__ = "ajuste_motivos"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_bronze_ajuste_motivo_id"),
        {"schema": "bronze"},
    )

    id          = Column(Integer, primary_key=True, autoincrement=True)
    solides_id  = Column(String(100), nullable=False)
    raw_json    = Column(JSON, nullable=False)
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BronzeAjuste(Base):
    __tablename__ = "ajustes"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_bronze_ajuste_id"),
        {"schema": "bronze"},
    )

    id          = Column(Integer, primary_key=True, autoincrement=True)
    solides_id  = Column(String(100), nullable=False)
    raw_json    = Column(JSON, nullable=False)
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BronzeFeriado(Base):
    __tablename__ = "feriados"
    __table_args__ = (
        UniqueConstraint("solides_id", name="uq_bronze_feriado_id"),
        {"schema": "bronze"},
    )

    id          = Column(Integer, primary_key=True, autoincrement=True)
    solides_id  = Column(String(100), nullable=False)
    raw_json    = Column(JSON, nullable=False)
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BronzePonto(Base):
    __tablename__ = "pontos"
    __table_args__ = (
        UniqueConstraint("colaborador_id", "inicio_ts", name="uq_bronze_ponto"),
        {"schema": "bronze"},
    )

    id             = Column(Integer, primary_key=True, autoincrement=True)
    colaborador_id = Column(String(100), nullable=False)
    inicio_ts      = Column(String(50), nullable=False)
    raw_json       = Column(JSON, nullable=False)
    ingested_at    = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
