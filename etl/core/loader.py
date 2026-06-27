import os
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

load_dotenv()
opcoes = ClientOptions(schema="public")
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"), options=opcoes)

def mapear_e_limpar(dados):
    if not dados: return []
    for item in dados:
        # Apenas converte strings vazias para None para o banco não dar erro de tipo numérico
        for k, v in item.items():
            if v == "": item[k] = None
    return dados

def carregar_dados(tabela, dados_brutos):
    if not dados_brutos:
        print(f"⚠️ Sem dados para carregar em {tabela}.")
        return

    print(f"☁️ Preparando carga para {tabela}...")
    dados_prontos = mapear_e_limpar(dados_brutos)
    
    try:
        # O upsert vai SOBRESCREVER os zeros/nulos antigos pelos IDs reais novos
        supabase.table(tabela).upsert(dados_prontos).execute()
        print(f"✅ Sucesso: {tabela} atualizada com {len(dados_prontos)} registros.")
    except Exception as e:
        print(f"❌ Erro ao carregar {tabela}: {e}")