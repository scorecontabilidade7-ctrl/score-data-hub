"""
Camada Silver — Transformação
Lê Bronze, limpa, normaliza, valida e persiste na Silver.
"""

from datetime import date, datetime
from config.database import get_session
from models.bronze import (
    BronzeColaborador, BronzeCargo, BronzeDepartamento, BronzePerfil,
    BronzeAjusteMotivo, BronzeAjuste, BronzeFeriado, BronzePonto,
)
from models.silver import (
    SilverColaborador, SilverCargo, SilverDepartamento, SilverPerfil,
    SilverAjusteMotivo, SilverAjuste, SilverFeriado, SilverPonto,
)
from utils.logger import get_logger

logger = get_logger(__name__)


def _parse_date(value) -> date | None:
    if not value:
        return None
    # Timestamp em milissegundos (ex: 1774839600000)
    if isinstance(value, (int, float)) and value > 1_000_000_000_000:
        try:
            return datetime.utcfromtimestamp(value / 1000).date()
        except Exception:
            return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(str(value)[:10], fmt[:8]).date()
        except ValueError:
            continue
    return None


def _normalize_status(raw, fired: bool = False) -> str:
    if fired:
        return "desligado"
    # API retorna inteiro: 0=ativo, 1=ferias, 2=afastado
    int_map = {0: "ativo", 1: "ferias", 2: "afastado"}
    if isinstance(raw, int):
        return int_map.get(raw, "ativo")
    mapping = {
        "active": "ativo", "ativo": "ativo",
        "vacation": "ferias", "ferias": "ferias",
        "away": "afastado", "afastado": "afastado",
        "inactive": "desligado", "desligado": "desligado",
    }
    return mapping.get(str(raw).lower().strip(), "ativo")


def _normalize_genero(raw: str) -> str:
    mapping = {
        "m": "masculino", "masculino": "masculino", "male": "masculino",
        "f": "feminino", "feminino": "feminino", "female": "feminino",
    }
    return mapping.get(str(raw).lower().strip(), "não informado")


def _normalize_perfil_disc(raw: str) -> str:
    mapping = {
        "d": "executor", "executor": "executor", "dominance": "executor",
        "i": "comunicador", "comunicador": "comunicador", "influence": "comunicador",
        "s": "planejador", "planejador": "planejador", "steadiness": "planejador",
        "c": "analista", "analista": "analista", "conscientiousness": "analista",
    }
    return mapping.get(str(raw).lower().strip(), "não mapeado")


class SilverTransformer:

    def transform_colaboradores(self) -> int:
        logger.info("Transformando colaboradores Bronze -> Silver...")
        count = 0
        for session in get_session():
            # Monta lookups de id -> nome para cargos e departamentos
            cargo_map = {
                str(r.raw_json.get("id", "")): str(r.raw_json.get("description") or r.raw_json.get("name", ""))
                for r in session.query(BronzeCargo).all()
            }
            dept_map = {
                str(r.raw_json.get("id", "")): str(r.raw_json.get("name", ""))
                for r in session.query(BronzeDepartamento).all()
            }

            bronze_rows = session.query(BronzeColaborador).all()
            for row in bronze_rows:
                j = row.raw_json
                colab_id = row.solides_id

                cargo_id = str(
                    (j.get("jobRoleDTO") or {}).get("id")
                    or j.get("jobRoleId") or ""
                )
                dept_ids = [str(w.get("id", "")) for w in j.get("workplaceList") or []]
                dept_id  = dept_ids[0] if dept_ids else ""

                existing = session.query(SilverColaborador).filter_by(solides_id=colab_id).first()
                data = dict(
                    solides_id        = colab_id,
                    nome              = str(j.get("name") or "").strip().title(),
                    email             = str(j.get("email", "")).strip().lower() or None,
                    cpf               = str(j.get("cpf", "")).strip() or None,
                    data_nascimento   = _parse_date(j.get("birthDate")),
                    data_admissao     = _parse_date(j.get("admissionDate") or j.get("effectiveDate")),
                    data_demissao     = _parse_date(j.get("resignationDate")),
                    status            = _normalize_status(j.get("status"), fired=bool(j.get("fired", False))),
                    genero            = _normalize_genero(j.get("gender") or j.get("genero", "")),
                    cargo_id          = cargo_id,
                    cargo_nome        = cargo_map.get(cargo_id, ""),
                    departamento_id   = dept_id,
                    departamento_nome = dept_map.get(dept_id, ""),
                    salario           = j.get("salary") or j.get("salario"),
                    tipo_contrato     = j.get("contractType") or j.get("tipoContrato"),
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(SilverColaborador(**data))
                count += 1
        logger.info(f"Colaboradores transformados: {count}")
        return count

    def transform_cargos(self) -> int:
        logger.info("Transformando cargos Bronze -> Silver...")
        count = 0
        for session in get_session():
            for row in session.query(BronzeCargo).all():
                j = row.raw_json
                existing = session.query(SilverCargo).filter_by(solides_id=row.solides_id).first()
                data = dict(
                    solides_id = row.solides_id,
                    nome       = str(j.get("description") or j.get("name") or j.get("nome", "")).strip(),
                    nivel      = j.get("level") or j.get("nivel"),
                    area       = j.get("area"),
                    ativo      = str(j.get("active", True)).lower(),
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(SilverCargo(**data))
                count += 1
        logger.info(f"Cargos transformados: {count}")
        return count

    def transform_departamentos(self) -> int:
        logger.info("Transformando departamentos Bronze → Silver...")
        count = 0
        for session in get_session():
            for row in session.query(BronzeDepartamento).all():
                j = row.raw_json
                existing = session.query(SilverDepartamento).filter_by(solides_id=row.solides_id).first()
                data = dict(
                    solides_id   = row.solides_id,
                    nome         = str(j.get("name") or j.get("nome", "")).strip(),
                    responsavel  = j.get("manager") or j.get("responsavel"),
                    ativo        = str(j.get("active", True)).lower(),
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(SilverDepartamento(**data))
                count += 1
        logger.info(f"Departamentos transformados: {count}")
        return count

    def transform_perfis(self) -> int:
        logger.info("Transformando perfis Bronze → Silver...")
        count = 0
        for session in get_session():
            for row in session.query(BronzePerfil).all():
                j = row.raw_json
                existing = session.query(SilverPerfil).filter_by(colaborador_id=row.colaborador_id).first()

                scores = j.get("scores") or j.get("profileScores") or {}
                data = dict(
                    colaborador_id    = row.colaborador_id,
                    perfil_dominante  = _normalize_perfil_disc(
                        j.get("dominantProfile") or j.get("perfilDominante", "")
                    ),
                    score_executor    = scores.get("D") or scores.get("executor"),
                    score_comunicador = scores.get("I") or scores.get("comunicador"),
                    score_planejador  = scores.get("S") or scores.get("planejador"),
                    score_analista    = scores.get("C") or scores.get("analista"),
                    nivel_energia     = j.get("energyLevel") or j.get("nivelEnergia"),
                    indice_satisfacao = j.get("satisfactionIndex") or j.get("indiceSatisfacao"),
                    data_aplicacao    = _parse_date(j.get("appliedAt") or j.get("dataAplicacao")),
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(SilverPerfil(**data))
                count += 1
        logger.info(f"Perfis transformados: {count}")
        return count

    def transform_ajuste_motivos(self) -> int:
        logger.info("Transformando motivos de ajuste Bronze -> Silver...")
        count = 0
        for session in get_session():
            for row in session.query(BronzeAjusteMotivo).all():
                j = row.raw_json
                existing = session.query(SilverAjusteMotivo).filter_by(solides_id=row.solides_id).first()
                data = dict(
                    solides_id  = row.solides_id,
                    descricao   = str(j.get("description", "")).strip(),
                    conta_falta = str(j.get("countAsMissing", False)).lower(),
                    dia_inteiro = str(j.get("fullDay", False)).lower(),
                    absenteismo = str(j.get("accountAsAbsenteeism", False)).lower(),
                    ativo       = str(j.get("active", True)).lower(),
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(SilverAjusteMotivo(**data))
                count += 1
        logger.info(f"Motivos de ajuste transformados: {count}")
        return count

    def transform_ajustes(self) -> int:
        logger.info("Transformando ajustes Bronze -> Silver...")
        count = 0
        for session in get_session():
            for row in session.query(BronzeAjuste).all():
                j = row.raw_json
                emp = j.get("employeeDTO") or {}
                motivo = j.get("adjustmentReason") or j.get("reason") or {}
                existing = session.query(SilverAjuste).filter_by(solides_id=row.solides_id).first()
                data = dict(
                    solides_id       = row.solides_id,
                    colaborador_id   = str(emp.get("id", "")),
                    colaborador_nome = str(emp.get("name", "")).strip().title(),
                    data_inicio      = _parse_date(j.get("startDate")),
                    data_fim         = _parse_date(j.get("endDate")),
                    dia_inteiro      = str(j.get("fullDay", False)).lower(),
                    origem           = j.get("origem") or j.get("origin"),
                    observacao       = j.get("observation"),
                    motivo_id        = str(motivo.get("id", "")) if motivo else None,
                    motivo_descricao = str(motivo.get("description", "")).strip() if motivo else None,
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(SilverAjuste(**data))
                count += 1
        logger.info(f"Ajustes transformados: {count}")
        return count

    def transform_feriados(self) -> int:
        logger.info("Transformando feriados Bronze -> Silver...")
        count = 0
        for session in get_session():
            for row in session.query(BronzeFeriado).all():
                j = row.raw_json
                existing = session.query(SilverFeriado).filter_by(solides_id=row.solides_id).first()
                data = dict(
                    solides_id      = row.solides_id,
                    descricao       = str(j.get("description", "")).strip(),
                    data            = _parse_date(j.get("date")),
                    calendario_nome = j.get("calendario_nome"),
                    ano             = j.get("ano"),
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(SilverFeriado(**data))
                count += 1
        logger.info(f"Feriados transformados: {count}")
        return count

    def transform_pontos(self) -> int:
        logger.info("Transformando pontos Bronze -> Silver...")
        count = 0
        for session in get_session():
            for row in session.query(BronzePonto).all():
                j = row.raw_json
                inicio_ts = row.inicio_ts
                inicio_dt = _parse_date(j.get("startDateTimestamp"))
                fim_ms    = j.get("endDateTimestamp")
                hora_entrada = None
                hora_saida   = None
                if j.get("startDateTimestamp"):
                    from datetime import timezone
                    dt_in  = __import__("datetime").datetime.utcfromtimestamp(j["startDateTimestamp"] / 1000)
                    hora_entrada = dt_in.strftime("%H:%M")
                    if fim_ms:
                        dt_out = __import__("datetime").datetime.utcfromtimestamp(fim_ms / 1000)
                        hora_saida = dt_out.strftime("%H:%M")

                existing = session.query(SilverPonto).filter_by(
                    colaborador_id=row.colaborador_id, inicio_ts=inicio_ts
                ).first()
                seg = j.get("workedTimeInSeconds") or 0
                data = dict(
                    colaborador_id       = row.colaborador_id,
                    inicio_ts            = inicio_ts,
                    data_trabalhada      = _parse_date(j.get("dateWorked")),
                    hora_entrada         = hora_entrada,
                    hora_saida           = hora_saida,
                    segundos_trabalhados = seg,
                    horas_trabalhadas    = round(seg / 3600, 2) if seg else 0,
                    status               = j.get("status"),
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(SilverPonto(**data))
                count += 1
        logger.info(f"Pontos transformados: {count}")
        return count

    def run(self) -> dict:
        logger.info("=== SILVER: Inicio da transformacao ===")
        result = {
            "colaboradores":  self.transform_colaboradores(),
            "cargos":         self.transform_cargos(),
            "departamentos":  self.transform_departamentos(),
            "ajuste_motivos": self.transform_ajuste_motivos(),
            "ajustes":        self.transform_ajustes(),
            "feriados":       self.transform_feriados(),
            "pontos":         self.transform_pontos(),
        }
        logger.info(f"=== SILVER: Transformacao concluida — {result} ===")
        return result
