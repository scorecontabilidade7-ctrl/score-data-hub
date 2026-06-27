"""
Pipeline principal — Orquestrador ETL
Executa as 3 camadas em sequência: Bronze → Silver → Gold

Uso:
    python pipeline.py              # Roda o pipeline completo
    python pipeline.py --layer bronze   # Roda só a Bronze
    python pipeline.py --layer silver   # Roda só a Silver
    python pipeline.py --layer gold     # Roda só a Gold
"""

import argparse
import sys
from datetime import datetime

from config.database import init_schemas, Base, engine
from models import bronze, silver, gold  # noqa — registra os models no Base
from layers.bronze.extractor import SolidesExtractor
from layers.silver.transformer import SilverTransformer
from layers.gold.aggregator import GoldAggregator
from utils.logger import get_logger

logger = get_logger("pipeline")


def setup_database():
    """Cria schemas e tabelas se ainda não existirem."""
    logger.info("Iniciando banco de dados...")
    init_schemas()
    Base.metadata.create_all(bind=engine)
    logger.info("Banco de dados pronto.")


def run_bronze() -> dict:
    return SolidesExtractor().run()


def run_silver() -> dict:
    return SilverTransformer().run()


def run_gold() -> dict:
    return GoldAggregator().run()


def run_full_pipeline() -> dict:
    start = datetime.utcnow()
    logger.info("╔══════════════════════════════════════╗")
    logger.info("║   PIPELINE SÓLIDES — INÍCIO          ║")
    logger.info("╚══════════════════════════════════════╝")

    setup_database()

    results = {}
    results["bronze"] = run_bronze()
    results["silver"] = run_silver()
    results["gold"]   = run_gold()

    elapsed = (datetime.utcnow() - start).total_seconds()
    logger.info("╔══════════════════════════════════════╗")
    logger.info(f"║   PIPELINE CONCLUÍDO em {elapsed:.1f}s       ║")
    logger.info("╚══════════════════════════════════════╝")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline ETL Sólides — Arquitetura Medallion")
    parser.add_argument(
        "--layer",
        choices=["bronze", "silver", "gold", "all"],
        default="all",
        help="Camada a executar (default: all)",
    )
    args = parser.parse_args()

    try:
        setup_database()
        if args.layer == "bronze":
            run_bronze()
        elif args.layer == "silver":
            run_silver()
        elif args.layer == "gold":
            run_gold()
        else:
            run_full_pipeline()
    except Exception as e:
        logger.error(f"Erro no pipeline: {e}", exc_info=True)
        sys.exit(1)
