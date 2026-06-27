import os
import json
import time
import requests
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

BASE_URL = os.getenv("EGESTOR_BASE_URL")
PERSONAL_TOKEN = os.getenv("EGESTOR_PERSONAL_TOKEN")
TOKEN_CACHE_FILE = "tmp/token_cache.json"

def gerar_novo_token():
    """Bate na API do eGestor e gera um novo access_token."""
    url = f"{BASE_URL}/oauth/access_token"
    payload = {
        "grant_type": "personal",
        "personal_token": PERSONAL_TOKEN
    }
    headers = {"Content-Type": "application/json"}
    
    print("🔄 Gerando um novo access_token na API...")
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    dados = response.json()
    
    # Calcula o timestamp de expiração (damos uma margem de segurança de 30 segundos)
    expires_in = dados.get("expires_in", 900)
    valid_until = time.time() + expires_in - 30 
    
    cache_data = {
        "access_token": dados["access_token"],
        "valid_until": valid_until
    }
    
    # Salva no arquivo de cache
    os.makedirs(os.path.dirname(TOKEN_CACHE_FILE), exist_ok=True)
    with open(TOKEN_CACHE_FILE, "w") as f:
        json.dump(cache_data, f)
        
    return cache_data["access_token"]

def get_valid_token():
    """
    Função principal que os outros scripts vão chamar.
    Retorna o token do cache se for válido, ou gera um novo se estiver expirado.
    """
    # Verifica se o arquivo de cache existe
    if os.path.exists(TOKEN_CACHE_FILE):
        with open(TOKEN_CACHE_FILE, "r") as f:
            try:
                cache_data = json.load(f)
                # Verifica se ainda está válido
                if time.time() < cache_data.get("valid_until", 0):
                    print("✅ Usando access_token válido do cache.")
                    return cache_data["access_token"]
            except json.JSONDecodeError:
                pass # Arquivo corrompido, vai gerar um novo
                
    # Se não existe ou expirou, gera um novo
    return gerar_novo_token()

# Bloco apenas para testar este módulo isoladamente
if __name__ == "__main__":
    token = get_valid_token()
    print(f"Token ativo: {token[:20]}...")