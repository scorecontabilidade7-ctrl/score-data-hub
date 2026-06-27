import os
import time
import requests
from dotenv import load_dotenv
from .auth_manager import get_valid_token

load_dotenv()
BASE_URL = os.getenv("EGESTOR_BASE_URL")

# A CHAVE MESTRA que obriga a API a mandar as categorias
CAMPOS_EXPLICITOS = (
    "codigo,numDoc,descricao,valor,taxa,data,dtVenc,dtPgto,dtCad,dtComp,"
    "situacao,codContato,nomeContato,origem,codDisponivel,codModulo,obs,tags,"
    "codPlanoContas,codFormaPgto,codCaixa,codRecibo"
)

def extrair_financeiro(endpoint, dt_ini, dt_fim):
    """Extrai recebimentos ou pagamentos com todos os campos."""
    url = f"{BASE_URL}/v1/{endpoint}"
    pagina_atual = 1
    dados_completos = []
    
    print(f"\n🚀 Extraindo {endpoint} ({dt_ini} a {dt_fim})...")
    
    while True:
        token = get_valid_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        params = {
            "dtIni": dt_ini,
            "dtFim": dt_fim,
            "dtTipo": "dtVencPgto",
            "fields": CAMPOS_EXPLICITOS, 
            "page": pagina_atual
        }
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 429:
            print("⏳ Throttling API... aguardando 60s")
            time.sleep(60)
            continue
            
        response.raise_for_status()
        res_json = response.json()
        dados_pagina = res_json.get("data", [])
        
        if not dados_pagina: break
            
        dados_completos.extend(dados_pagina)
        print(f"   📥 Página {pagina_atual} extraída ({len(dados_pagina)} registros).")
        
        if pagina_atual >= res_json.get("last_page", 1): break
        pagina_atual += 1
        time.sleep(1.1)
        
    return dados_completos

def extrair_plano_contas():
    """Extrai todas as categorias do Plano de Contas."""
    url = f"{BASE_URL}/v1/planoContas"
    pagina_atual = 1
    dados_completos = []
    
    print("\n📂 Extraindo Plano de Contas...")
    while True:
        token = get_valid_token()
        headers = {"Authorization": f"Bearer {token}"}
        params = {"page": pagina_atual}
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        res_json = response.json()
        dados_pagina = res_json.get("data", [])
        
        if not dados_pagina: break
        dados_completos.extend(dados_pagina)
        if pagina_atual >= res_json.get("last_page", 1): break
        pagina_atual += 1
        time.sleep(1)
    return dados_completos

def extrair_formas_pagamento():
    """Extrai todas as formas de pagamento cadastradas."""
    url = f"{BASE_URL}/v1/formasPagamento"
    pagina_atual = 1
    dados_completos = []
    
    print("\n💳 Extraindo Formas de Pagamento...")
    while True:
        token = get_valid_token()
        headers = {"Authorization": f"Bearer {token}"}
        params = {"page": pagina_atual}
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        res_json = response.json()
        dados_pagina = res_json.get("data", [])
        
        if not dados_pagina: break
        dados_completos.extend(dados_pagina)
        if pagina_atual >= res_json.get("last_page", 1): break
        pagina_atual += 1
        time.sleep(1)
    return dados_completos