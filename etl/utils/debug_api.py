import os
import requests
import json
from auth_manager import get_valid_token
from dotenv import load_dotenv

load_dotenv()
BASE_URL = os.getenv("EGESTOR_BASE_URL")

def testar_retorno_completo():
    token = get_valid_token()
    url = f"{BASE_URL}/v1/recebimentos"
    

    campos_escondidos = "codigo,descricao,valor,data,situacao,nomeContato,codPlanoContas,codFormaPgto,codCaixa,dtVenc,dtPgto,dtComp"
    
    params = {
        "limit": 1,
        "fields": campos_escondidos # Passando a chave para a API
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📡 Chamando API e EXIGINDO os campos ocultos...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        dados = response.json()
        print("\n🔍 --- NOVO JSON (AGORA COM OS DADOS COMPLETOS) ---")
        print(json.dumps(dados, indent=4, ensure_ascii=False))
    else:
        print(f"❌ Erro: {response.status_code}")

if __name__ == "__main__":
    testar_retorno_completo()