import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Shield, Trash2, Pencil, Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/hooks/useAuth";

const AVAILABLE_MODULES = [
  { id: "financeiro", label: "Financeiro" },
  { id: "pdi", label: "PD&I" },
  { id: "rh", label: "RH" },
];

const AVAILABLE_DASHBOARDS = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "a-receber", label: "A Receber" },
  { id: "a-pagar", label: "A Pagar" },
  { id: "dfc", label: "DFC" },
  { id: "dre", label: "DRE" },
  { id: "extrato", label: "Extrato" },
  { id: "indicadores", label: "Indicadores" },
  { id: "orcamento", label: "Orçamento" },
];

export function AdminPanel() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [newRole, setNewRole] = useState<UserProfile["role"]>("usuario");
  const [selectedModules, setSelectedModules] = useState<string[]>(["financeiro"]);
  const [selectedDashboards, setSelectedDashboards] = useState<string[]>(["visao-geral"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<UserProfile["role"]>("usuario");
  const [editApiKey, setEditApiKey] = useState("");
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editDashboards, setEditDashboards] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await externalSupabase
      .from("datahub_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar usuários.");
    } else if (data) {
      setUsers(data as UserProfile[]);
    }
    setIsLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    if (profile?.role !== "admin") {
      toast.error("Apenas administradores podem criar usuários.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await externalSupabase.functions.invoke("datahub_create_user", {
        body: {
          email: newEmail,
          password: newPassword,
          role: newRole,
          ai_api_key: newApiKey || null,
          modules: selectedModules,
          dashboards: selectedDashboards,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Usuário ${newEmail} criado com sucesso!`);
      setNewEmail("");
      setNewPassword("");
      setNewApiKey("");
      fetchUsers(); // Refresh list
    } catch (err: any) {
      toast.error(`Erro ao criar usuário: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditApiKey(user.ai_api_key || "");
    setEditModules([...user.modules]);
    setEditDashboards([...user.dashboards]);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSavingEdit(true);

    try {
      const { error } = await externalSupabase
        .from("datahub_profiles")
        .update({
          role: editRole,
          ai_api_key: editApiKey || null,
          modules: editModules,
          dashboards: editDashboards,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success(`Usuário ${editingUser.username} atualizado!`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro ao atualizar usuário.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteUser = () => {
    toast.error("Por questões de segurança, a exclusão deve ser feita diretamente no painel do Supabase.");
  };

  const toggleModule = (id: string, checked: boolean, list: string[], setList: (v: string[]) => void) => {
    setList(checked ? [...list, id] : list.filter(x => x !== id));
  };

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Shield className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground mt-2">Você não tem permissão para acessar o Painel Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Cadastro */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Novo Usuário</CardTitle>
            <CardDescription>Cadastre novos membros e defina acessos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Ex: joao.silva@score.com.br" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Chave de API (IA)</Label>
                <Input type="password" value={newApiKey} onChange={e => setNewApiKey(e.target.value)} placeholder="sk-or-... ou AIza..." />
                <p className="text-[10px] text-muted-foreground">Opcional. Gemini ou OpenRouter.</p>
              </div>
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="usuario">Usuário Padrão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Módulos Permitidos</Label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_MODULES.map(m => (
                    <div key={m.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`m-${m.id}`}
                        checked={selectedModules.includes(m.id)}
                        onCheckedChange={(checked) => toggleModule(m.id, !!checked, selectedModules, setSelectedModules)}
                      />
                      <label htmlFor={`m-${m.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{m.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Dashboards (Financeiro)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_DASHBOARDS.map(d => (
                    <div key={d.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`d-${d.id}`}
                        checked={selectedDashboards.includes(d.id)}
                        onCheckedChange={(checked) => toggleModule(d.id, !!checked, selectedDashboards, setSelectedDashboards)}
                      />
                      <label htmlFor={`d-${d.id}`} className="text-sm font-medium leading-none">{d.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Usuário
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Gestão de Acessos</CardTitle>
            <CardDescription>Usuários cadastrados e seus níveis de permissão.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail (Usuário)</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>IA</TableHead>
                    <TableHead>Módulos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-bold">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : user.role === "gerente" ? "secondary" : "outline"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.ai_api_key ? "text-primary border-primary" : "text-muted-foreground"}>
                          {user.ai_api_key ? "Configurada" : "Não configurada"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.modules.map(m => (
                            <span key={m} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-bold">{m}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(user)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser()}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuário: <span className="text-primary">{editingUser?.username}</span></DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={editRole} onValueChange={(v: any) => setEditRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="usuario">Usuário Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chave de API (IA)</Label>
              <Input type="password" value={editApiKey} onChange={e => setEditApiKey(e.target.value)} placeholder="sk-or-... ou AIza..." />
              <p className="text-[10px] text-muted-foreground">Para limpar a chave, apague o conteúdo.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Módulos Permitidos</Label>
              <div className="grid grid-cols-1 gap-2">
                {AVAILABLE_MODULES.map(m => (
                  <div key={m.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-m-${m.id}`}
                      checked={editModules.includes(m.id)}
                      onCheckedChange={(checked) => toggleModule(m.id, !!checked, editModules, setEditModules)}
                    />
                    <label htmlFor={`edit-m-${m.id}`} className="text-sm font-medium leading-none">{m.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Dashboards (Financeiro)</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_DASHBOARDS.map(d => (
                  <div key={d.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-d-${d.id}`}
                      checked={editDashboards.includes(d.id)}
                      onCheckedChange={(checked) => toggleModule(d.id, !!checked, editDashboards, setEditDashboards)}
                    />
                    <label htmlFor={`edit-d-${d.id}`} className="text-sm font-medium leading-none">{d.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
