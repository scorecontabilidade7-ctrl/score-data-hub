import { useState, useEffect } from "react";

export interface KestraStatus {
  lastUpdated: string;
  status: 'Sucesso' | 'Em Execução' | 'Falha' | 'Pausado' | 'Desconhecido';
  kestraUrl: string;
}

export function useKestraStatus() {
  const [status, setStatus] = useState<KestraStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      const fullUrl = import.meta.env.VITE_KESTRA_STATUS_URL;
      const basicAuth = import.meta.env.VITE_KESTRA_BASIC_AUTH;

      if (!fullUrl || !basicAuth) {
        console.warn("Kestra Status: Variáveis VITE_KESTRA_STATUS_URL ou VITE_KESTRA_BASIC_AUTH não encontradas no ambiente (env)!");
        setIsLoading(false);
        setError("Kestra não configurado no .env");
        return;
      }

      try {
        let apiUrlBase = fullUrl;
        
        // Se o usuário colou a URL da interface (UI) em vez da API, vamos tentar corrigir automaticamente
        if (fullUrl.includes('/ui/')) {
          const match = fullUrl.match(/^(https?:\/\/[^\/]+)/);
          if (match) {
            apiUrlBase = `${match[1]}/api/v1/executions/search`;
          }
        }
        
        const urlObj = new URL(apiUrlBase);
        
        // Garantir que limitamos a 1 resultado e ordenamos do mais recente pro mais antigo
        urlObj.searchParams.set('size', '1');
        urlObj.searchParams.set('page', '1');
        urlObj.searchParams.set('sort', 'state.startDate:desc');
        
        // Extrair o namespace e flowId (pode vir da URL antiga da UI ou da nova)
        // Se vier da UI: /ui/main/flows/edit/NAMESPACE/FLOW_ID
        let namespace = urlObj.searchParams.get('namespace');
        let flowId = urlObj.searchParams.get('flowId');
        
        if (!namespace || !flowId) {
          if (fullUrl.includes('/edit/')) {
            const parts = fullUrl.split('/edit/')[1].split('?')[0].split('/');
            if (parts.length >= 2) {
              namespace = parts[0];
              flowId = parts[1];
              urlObj.searchParams.set('namespace', namespace);
              urlObj.searchParams.set('flowId', flowId);
            }
          }
        }
        
        const apiUrl = urlObj.origin;

        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(basicAuth)}`
        };
        
        // Em vez de bater direto na API e tomar block do CORS, 
        // usamos o proxy configurado no vite.config.ts (ou vercel.json em prod)
        const proxyUrl = `/kestra-api/api/v1/executions/search?${urlObj.searchParams.toString()}`;
        
        const res = await fetch(proxyUrl, { headers });
        
        if (!res.ok) {
          throw new Error(`Erro na API: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
          const exec = data.results[0];
          
          let statusFormat: KestraStatus['status'] = 'Desconhecido';
          const rawState = exec.state?.current;
          
          if (rawState === 'SUCCESS') {
            statusFormat = 'Sucesso';
          } else if (['RUNNING', 'CREATED', 'RESTARTED'].includes(rawState)) {
            statusFormat = 'Em Execução';
          } else if (rawState === 'PAUSED') {
            statusFormat = 'Pausado';
          } else if (['FAILED', 'KILLED'].includes(rawState)) {
            statusFormat = 'Falha';
          }

          let dataStr = 'N/A';
          const targetDate = exec.state?.endDate || exec.state?.startDate;
          if (targetDate) {
            const dt = new Date(targetDate);
            dataStr = dt.toLocaleString('pt-BR', { 
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
          }

          const uiUrl = `${apiUrl}/ui/executions/${namespace}/${flowId}/${exec.id}`;

          setStatus({
            lastUpdated: dataStr,
            status: statusFormat,
            kestraUrl: uiUrl
          });
        } else {
          console.warn("Kestra Status: Nenhum resultado encontrado na resposta!", data);
        }
      } catch (err: any) {
        console.error("Erro ao buscar status do Kestra:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
    
    // Atualiza a cada 2 minutos
    const intervalId = setInterval(fetchStatus, 120000);
    return () => clearInterval(intervalId);
  }, []);

  return { status, isLoading, error };
}
