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
        setIsLoading(false);
        setError("Kestra não configurado no .env");
        return;
      }

      try {
        const urlObj = new URL(fullUrl);
        // Garantir que limitamos a 1 resultado
        urlObj.searchParams.set('size', '1');
        urlObj.searchParams.set('page', '1');
        
        const namespace = urlObj.searchParams.get('namespace');
        const flowId = urlObj.searchParams.get('flowId');
        const apiUrl = fullUrl.split('/api/v1/')[0];

        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(basicAuth)}`
        };
        
        const res = await fetch(urlObj.toString(), { headers });
        
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
          if (exec.state?.startDate) {
            const dt = new Date(exec.state.startDate);
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
