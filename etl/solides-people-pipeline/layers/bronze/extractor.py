"""
Camada Bronze — Extração
Busca os dados brutos da API do Sólides e persiste sem transformação.
"""

import requests
from typing import Generator
from config.settings import settings
from config.database import get_session
from models.bronze import (
    BronzeColaborador, BronzeCargo, BronzeDepartamento, BronzePerfil,
    BronzeAjusteMotivo, BronzeAjuste, BronzeFeriado, BronzePonto,
)
from utils.logger import get_logger
from utils.retry import api_retry

logger = get_logger(__name__)


class SolidesExtractor:

    def __init__(self):
        self.base_url = settings.solides_base_url
        self.headers = settings.solides_headers

    # ── API helpers ────────────────────────────────────────────────────────

    @api_retry
    def _get(self, endpoint: str, params: dict = None) -> dict:
        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params, timeout=15)
        response.raise_for_status()
        return response.json()

    def _paginate(self, endpoint: str, page_size: int = 100) -> Generator[dict, None, None]:
        """Itera sobre todas as páginas de um endpoint paginado."""
        page = 0
        while True:
            data = self._get(endpoint, params={"page": page, "size": page_size})
            content = data.get("content", [])
            if not content:
                break
            yield from content
            if data.get("last", True):
                break
            page += 1

    # ── Extrações ──────────────────────────────────────────────────────────

    def extract_colaboradores(self) -> int:
        logger.info("Extraindo colaboradores da API Sólides...")
        count = 0
        for session in get_session():
            for item in self._paginate("/employee/find-all"):
                solides_id = str(item.get("id") or item.get("externalId", ""))
                existing = session.query(BronzeColaborador).filter_by(solides_id=solides_id).first()
                if existing:
                    existing.raw_json = item
                else:
                    session.add(BronzeColaborador(solides_id=solides_id, raw_json=item))
                count += 1
        logger.info(f"Colaboradores extraídos: {count}")
        return count

    def extract_cargos(self) -> int:
        logger.info("Extraindo cargos...")
        count = 0
        for session in get_session():
            for item in self._paginate("/job-role/find-all"):
                solides_id = str(item.get("id", ""))
                existing = session.query(BronzeCargo).filter_by(solides_id=solides_id).first()
                if existing:
                    existing.raw_json = item
                else:
                    session.add(BronzeCargo(solides_id=solides_id, raw_json=item))
                count += 1
        logger.info(f"Cargos extraídos: {count}")
        return count

    def extract_departamentos(self) -> int:
        logger.info("Extraindo departamentos...")
        count = 0
        for session in get_session():
            for item in self._paginate("/workplace/find-all"):
                solides_id = str(item.get("id", ""))
                existing = session.query(BronzeDepartamento).filter_by(solides_id=solides_id).first()
                if existing:
                    existing.raw_json = item
                else:
                    session.add(BronzeDepartamento(solides_id=solides_id, raw_json=item))
                count += 1
        logger.info(f"Departamentos extraídos: {count}")
        return count

    def extract_perfis(self, colaborador_ids: list[str]) -> int:
        """
        Extrai perfis comportamentais (Profiler) para cada colaborador.
        Endpoint: GET /profiler/employee/{id}
        """
        logger.info(f"Extraindo perfis de {len(colaborador_ids)} colaboradores...")
        count = 0
        for session in get_session():
            for colab_id in colaborador_ids:
                try:
                    data = self._get(f"/profiler/employee/{colab_id}")
                    if not data:
                        continue
                    existing = session.query(BronzePerfil).filter_by(colaborador_id=colab_id).first()
                    if existing:
                        existing.raw_json = data
                    else:
                        session.add(BronzePerfil(colaborador_id=colab_id, raw_json=data))
                    count += 1
                except Exception as e:
                    logger.warning(f"Perfil não encontrado para colaborador {colab_id}: {e}")
        logger.info(f"Perfis extraídos: {count}")
        return count

    def extract_ajuste_motivos(self) -> int:
        logger.info("Extraindo motivos de ajuste...")
        count = 0
        for session in get_session():
            for item in self._paginate("/adjustment-reason/find-all"):
                solides_id = str(item.get("id", ""))
                existing = session.query(BronzeAjusteMotivo).filter_by(solides_id=solides_id).first()
                if existing:
                    existing.raw_json = item
                else:
                    session.add(BronzeAjusteMotivo(solides_id=solides_id, raw_json=item))
                count += 1
        logger.info(f"Motivos de ajuste extraidos: {count}")
        return count

    def extract_ajustes(self) -> int:
        logger.info("Extraindo ajustes de ponto...")
        count = 0
        for session in get_session():
            for item in self._paginate("/adjustment/find-all"):
                solides_id = str(item.get("id", ""))
                existing = session.query(BronzeAjuste).filter_by(solides_id=solides_id).first()
                if existing:
                    existing.raw_json = item
                else:
                    session.add(BronzeAjuste(solides_id=solides_id, raw_json=item))
                count += 1
        logger.info(f"Ajustes extraidos: {count}")
        return count

    def extract_feriados(self) -> int:
        logger.info("Extraindo feriados...")
        count = 0
        for session in get_session():
            data = self._get("/holiday-calendar/")
            calendarios = data.get("item", []) if isinstance(data, dict) else data
            for cal in calendarios:
                cal_nome = cal.get("name", "")
                cal_ano  = cal.get("year")
                for feriado in cal.get("holidays", []):
                    solides_id = str(feriado.get("id", ""))
                    raw = {**feriado, "calendario_nome": cal_nome, "ano": cal_ano}
                    existing = session.query(BronzeFeriado).filter_by(solides_id=solides_id).first()
                    if existing:
                        existing.raw_json = raw
                    else:
                        session.add(BronzeFeriado(solides_id=solides_id, raw_json=raw))
                    count += 1
        logger.info(f"Feriados extraidos: {count}")
        return count

    def extract_pontos(self, colaborador_ids: list[str]) -> int:
        logger.info(f"Extraindo batidas de ponto de {len(colaborador_ids)} colaboradores...")
        count = 0
        for session in get_session():
            for colab_id in colaborador_ids:
                try:
                    data = self._get(f"/external/api/v1/payssego/punches/{colab_id}")
                    registros = data.get("content", []) if isinstance(data, dict) else data
                    for item in registros:
                        inicio_ts = str(item.get("startDateTimestamp", ""))
                        existing = session.query(BronzePonto).filter_by(
                            colaborador_id=colab_id, inicio_ts=inicio_ts
                        ).first()
                        if existing:
                            existing.raw_json = item
                        else:
                            session.add(BronzePonto(
                                colaborador_id=colab_id,
                                inicio_ts=inicio_ts,
                                raw_json=item,
                            ))
                        count += 1
                except Exception as e:
                    logger.warning(f"Ponto nao encontrado para colaborador {colab_id}: {e}")
        logger.info(f"Batidas de ponto extraidas: {count}")
        return count

    def run(self) -> dict:
        """Executa todas as extrações da camada Bronze."""
        logger.info("=== BRONZE: Inicio da extracao ===")
        result = {
            "colaboradores":   self.extract_colaboradores(),
            "cargos":          self.extract_cargos(),
            "departamentos":   self.extract_departamentos(),
            "ajuste_motivos":  self.extract_ajuste_motivos(),
            "ajustes":         self.extract_ajustes(),
            "feriados":        self.extract_feriados(),
        }
        # Pontos por colaborador
        for session in get_session():
            ids = [str(r.solides_id) for r in session.query(BronzeColaborador).all()]
        result["pontos"] = self.extract_pontos(ids)

        logger.info(f"=== BRONZE: Extracao concluida — {result} ===")
        return result
