import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoScore from "@/assets/logo_score.png";
import { externalSupabase } from "@/integrations/supabase/external-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginEmail = email.trim();

      const { error } = await externalSupabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        toast.error("Usuário ou senha incorretos.");
        return;
      }

      toast.success(`Bem-vindo ao Score Data Hub!`);
      navigate("/");
    } catch (error: any) {
      toast.error("Erro inesperado ao conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4 font-sans">
      <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
        <div className="bg-[#1A1A1A] p-10 text-center border-b border-white/5">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full border-2 border-primary flex items-center justify-center p-4 bg-white/10 shadow-lg">
              <img src={logoScore} alt="Score Data Hub" className="w-full h-full object-contain brightness-110" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Score Data Hub</h1>
          <p className="text-[11px] text-primary font-bold uppercase tracking-[0.4em] mt-2">Plataforma de Inteligência</p>
        </div>
        
        <CardContent className="p-10 pt-12">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-black/40 ml-1">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@score.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary h-14 text-base px-5 shadow-sm bg-gray-50 text-black"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-black/40 ml-1">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary h-14 text-base px-5 shadow-sm bg-gray-50 text-black"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 bg-[#1A1A1A] text-white hover:bg-black"
              disabled={isLoading}
            >
              {isLoading ? "Validando..." : "Acessar Sistema"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-gray-50/50 p-6 justify-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Desenvolvido por Score Tecnologia
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
