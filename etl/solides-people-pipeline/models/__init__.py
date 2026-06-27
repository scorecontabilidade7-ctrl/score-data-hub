from models.bronze import BronzeColaborador, BronzeCargo, BronzeDepartamento, BronzePerfil
from models.silver import SilverColaborador, SilverCargo, SilverDepartamento, SilverPerfil
from models.gold import GoldHeadcountDept, GoldDistribuicaoDisc, GoldMapaTalentos, GoldKpisRh

__all__ = [
    "BronzeColaborador", "BronzeCargo", "BronzeDepartamento", "BronzePerfil",
    "SilverColaborador", "SilverCargo", "SilverDepartamento", "SilverPerfil",
    "GoldHeadcountDept", "GoldDistribuicaoDisc", "GoldMapaTalentos", "GoldKpisRh",
]
