import os
import requests
import json
from auth_manager import get_valid_token
from dotenv import load_dotenv

load_dotenv()
BASE_URL = os.getenv("EGESTOR_BASE_URL")

def testar_pagamentos():
    token = get_valid_token()
    url = f"{BASE_URL}/v1/pagamentos"
    
    # Vamos pedir o codPlanoContas e outras variações para ver quem responde
    params = {
        "limit": 1,
        "fields": "codigo,descricao,valor,situacao,codPlanoContas,planoContas,codCategoria,categoria"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📡 Investigando como a API entrega os pagamentos...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        print("\n🔍 --- RETORNO DO PAGAMENTO ---")
        print(json.dumps(response.json(), indent=4, ensure_ascii=False))
    else:
        print(f"❌ Erro: {response.status_code}")

if __name__ == "__main__":
    testar_pagamentos()