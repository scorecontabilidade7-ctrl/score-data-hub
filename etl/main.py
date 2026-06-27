import os
from sources.egestor.extractor import extrair_financeiro, extrair_plano_contas, extrair_formas_pagamento
from core.loader import carregar_dados

def iniciar_sincronizacao():
    print("=== INICIANDO PIPELINE DATA HUB ===")
    
    # 1. Atualiza Tabelas de Apoio do eGestor
    carregar_dados("datahub_plano_contas", extrair_plano_contas())
    carregar_dados("datahub_formas_pagamento", extrair_formas_pagamento())
    
    # 2. Atualiza o Financeiro (Lendo variáveis de ambiente do Kestra, se disponíveis)
    data_ini = os.getenv("KESTRA_DATA_INICIAL")
    if not data_ini:
        data_ini = "2023-01-01"
        
    data_fim = os.getenv("KESTRA_DATA_FINAL")
    if not data_fim:
        data_fim = "2026-12-31" 
        
    print(f"Período de extração: {data_ini} a {data_fim}")
    
    recebimentos = extrair_financeiro("recebimentos", data_ini, data_fim)
    carregar_dados("datahub_recebimentos", recebimentos)
    
    pagamentos = extrair_financeiro("pagamentos", data_ini, data_fim)
    carregar_dados("datahub_pagamentos", pagamentos)
    
    print("\n🏁 Pipeline finalizado com sucesso!")


if __name__ == "__main__":

    iniciar_sincronizacao()