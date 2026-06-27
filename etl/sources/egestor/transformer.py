import os
import pandas as pd
import numpy as np
from core.loader import supabase
from dotenv import load_dotenv

# Carrega as variáveis de ambiente
load_dotenv()

def transformar_e_carregar_fluxo_caixa(recebimentos_raw, pagamentos_raw):
    print("\n⚙️ Iniciando transformação dos dados com Pandas...")
    
    df_rec = pd.DataFrame(recebimentos_raw)
    df_pag = pd.DataFrame(pagamentos_raw)
    
    # Prepara Recebimentos
    if not df_rec.empty:
        df_rec['tipo_movimento'] = 'Entrada'
        df_rec['id_transacao'] = 'REC_' + df_rec['codigo'].astype(str)
        df_rec['data_referencia'] = df_rec.get('dtVenc', df_rec.get('dtComp')) 
    
    # Prepara Pagamentos
    if not df_pag.empty:
        df_pag['tipo_movimento'] = 'Saida'
        df_pag['id_transacao'] = 'PAG_' + df_pag['codigo'].astype(str)
        df_pag['data_referencia'] = df_pag.get('dtVenc', df_pag.get('dtComp'))

    # Unifica as tabelas
    df_fluxo = pd.concat([df_rec, df_pag], ignore_index=True)
    
    if df_fluxo.empty:
        print("Nenhum dado para transformar.")
        return
        
    # Renomeia as colunas para o padrão snake_case do Postgres
    df_fluxo = df_fluxo.rename(columns={'nomeContato': 'nome_contato'})
        
    # Seleciona apenas as colunas que criamos no BD
    colunas_bd = [
        'id_transacao', 'codigo', 'descricao', 'valor', 
        'data_referencia', 'situacao', 'nome_contato', 
        'tipo_movimento', 'origem'
    ]
    
    # Filtra as colunas com segurança
    colunas_existentes = [col for col in colunas_bd if col in df_fluxo.columns]
    df_fluxo = df_fluxo[colunas_existentes]
    
    # Tipagem e limpeza
    df_fluxo['valor'] = pd.to_numeric(df_fluxo['valor'], errors='coerce').fillna(0.0)
    df_fluxo = df_fluxo.replace({np.nan: None})
    
    print(f"📊 Total de registros unificados: {len(df_fluxo)}")
    
    registros = df_fluxo.to_dict(orient='records')
    
    print("☁️ Fazendo UPSERT para o Supabase (Schema: score)...")
    try:
        # Envia os dados. O upsert atualiza automaticamente se o id_transacao já existir
        response = supabase.table('fluxo_caixa').upsert(registros).execute()
        print(f"✅ Sucesso! Dados sincronizados no Data Hub.")
    except Exception as e:
        print(f"❌ Erro ao enviar para o Supabase: {e}")