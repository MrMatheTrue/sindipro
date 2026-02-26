import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, AlertTriangle, ClipboardCheck, FileText, Plus, ArrowRight, Loader2, CheckCircle2, Circle, Clock, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  critico: { label: "Crítico", className: "bg-destructive/15 text-destructive border-destructive/30" },
  atencao: { label: "Atenção", className: "bg-warning/15 text-warning border-warning/30" },
  em_dia: { label: "Em dia", className: "bg-success/15 text-success border-success/30" },
} as const;

// ── Colaborador Dashboard ────────────────────────────────────────────────────
function ColaboradorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: acesso } = useQuery({
    queryKey: ["meu-acesso-full", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("condominio_acessos")
        .select("*, condominio:condominios(id, nome, endereco)")
        .eq("user_id", user!.id)
        .eq("status", "aprovado")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const condominioId = (acesso?.condominio as any)?.id;
  const condominioNome = (acesso?.condominio as any)?.nome || "Meu Condomínio";

  const { data: tarefas } = useQuery({
    queryKey: ["tarefas-colaborador", condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tarefas_checkin")
        .select("*")
        .eq("condominio_id", condominioId)
        .eq("status_ativo", true)
        .order("horario_previsto");
      if (error) throw error;
      return data;
    },
    enabled: !!condominioId,
  });

  const { data: execucoesHoje } = useQuery({
    queryKey: ["execucoes-hoje-colaborador", condominioId, user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("execucoes_checkin")
        .select("tarefa_id, data_execucao")
        .eq("condominio_id", condominioId)
        .eq("executado_por", user!.id)
        .gte("data_execucao", today);
      if (error) throw error;
      return data;
    },
    enabled: !!condominioId && !!user,
  });

  const { data: obrigacoes } = useQuery({
    queryKey: ["obrigacoes-colaborador", condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obrigacoes")
        .select("id, nome, status, data_proxima_realizacao, criticidade")
        .eq("condominio_id", condominioId)
        .order("data_proxima_realizacao");
      if (error) throw error;
      return data;
    },
    enabled: !!condominioId,
  });

  const today = new Date().toISOString().split('T')[0];
  const executadasHoje = execucoesHoje?.length ?? 0;
  const totalTarefas = tarefas?.length ?? 0;
  const pendentesHoje = totalTarefas - executadasHoje;
  const obrigacoesAlerta = obrigacoes?.filter(o => o.status !== "em_dia").length ?? 0;

  const kpis = [
    { label: "Tarefas do Dia", value: totalTarefas, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Realizadas Hoje", value: executadasHoje, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Pendentes", value: pendentesHoje, icon: Circle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Obrigações Alerta", value: obrigacoesAlerta, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, colaborador!</h1>
        <p className="text-muted-foreground mt-1">
          {condominioNome} · {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider leading-tight">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Check-in card */}
        <Card className="group hover:shadow-xl hover:border-primary/40 transition-all duration-300 overflow-hidden bg-card/60 border-primary/20 cursor-pointer"
          onClick={() => condominioId && navigate(`/condominios/${condominioId}/checkin`)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Check-in Operacional
            </CardTitle>
            <p className="text-sm text-muted-foreground">Registre as tarefas que você realizou hoje</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {tarefas?.slice(0, 3).map((t) => {
              const done = execucoesHoje?.some(e => e.tarefa_id === t.id);
              return (
                <div key={t.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${done ? 'bg-success/5' : 'bg-muted/40'}`}>
                  {done
                    ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${done ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</p>
                    {t.horario_previsto && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{t.horario_previsto}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {totalTarefas > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{totalTarefas - 3} outras tarefas</p>
            )}
            {totalTarefas === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-2">Nenhuma tarefa ativa</p>
            )}
            <Button className="w-full mt-2 font-bold" size="sm">
              Ver Check-in <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Obrigações card */}
        <Card className="group hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 overflow-hidden bg-card/60 border-amber-500/10 cursor-pointer"
          onClick={() => condominioId && navigate(`/condominios/${condominioId}/obrigacoes`)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 group-hover:text-amber-500 transition-colors">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              Obrigações
            </CardTitle>
            <p className="text-sm text-muted-foreground">Acompanhe os prazos e demandas do condomínio</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {obrigacoes?.slice(0, 3).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 gap-2">
                <p className="text-sm font-medium truncate flex-1">{o.nome}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border shrink-0 ${o.status === "vencida" ? "bg-red-500/10 text-red-600 border-red-200" :
                    o.status === "atencao" ? "bg-amber-500/10 text-amber-600 border-amber-200" :
                      "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                  }`}>
                  {o.status?.replace("_", " ")}
                </span>
              </div>
            ))}
            {(obrigacoes?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-2">Nenhuma obrigação cadastrada</p>
            )}
            <Button variant="outline" className="w-full mt-2 font-bold border-amber-500/30 hover:bg-amber-500/5" size="sm">
              Ver Obrigações <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Síndico Dashboard ────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, isSindico } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [unidades, setUnidades] = useState("");
  const [cnpj, setCnpj] = useState("");

  // Redirect to colaborador view
  if (!isSindico) {
    return <ColaboradorDashboard />;
  }

  const { data: condominios, isLoading } = useQuery({
    queryKey: ["condominios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("condominios").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: obrigacoes } = useQuery({
    queryKey: ["obrigacoes-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("obrigacoes").select("id, condominio_id, status, data_proxima_realizacao");
      if (error) throw error;
      return data;
    },
  });

  const { data: docsCount } = useQuery({
    queryKey: ["docs-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("documentos").select("*", { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("condominios").insert({
        sindico_id: user!.id,
        nome,
        endereco,
        cidade,
        estado,
        cnpj,
        numero_unidades: unidades ? parseInt(unidades) : 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominios"] });
      setDialogOpen(false);
      setNome(""); setEndereco(""); setCidade(""); setEstado(""); setUnidades(""); setCnpj("");
      toast({ title: "Condomínio criado com sucesso!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    },
  });

  const getCondoStatus = (condoId: string) => {
    if (!obrigacoes) return "em_dia";
    const condoObrigacoes = obrigacoes.filter((o) => o.condominio_id === condoId);
    if (condoObrigacoes.some((o) => o.status === "vencida")) return "critico";
    if (condoObrigacoes.some((o) => o.status === "atencao")) return "atencao";
    return "em_dia";
  };

  const filteredCondos = condominios?.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getCondoStatus(c.id);
    const matchesStatus = statusFilter === "todos" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalObrigacoesVencendo = obrigacoes?.filter((o) => o.status === "vencida" || o.status === "atencao").length ?? 0;

  const kpis = [
    { label: "Condomínios", value: condominios?.length ?? 0, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Alertas Críticos", value: obrigacoes?.filter(o => o.status === 'vencida').length ?? 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Obrigações / Mês", value: totalObrigacoesVencendo, icon: ClipboardCheck, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Documentos", value: docsCount ?? 0, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard SINDIPRO</h1>
          <p className="text-muted-foreground mt-1">Gestão inteligente para seus condomínios.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> Novo Condomínio</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Condomínio</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              className="space-y-4 pt-4"
            >
              <div className="space-y-2">
                <Label>Nome do Condomínio</Label>
                <Input placeholder="Residencial Aurora" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input placeholder="00.000.000/0001-91" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Unidades</Label>
                  <Input type="number" placeholder="48" value={unidades} onChange={(e) => setUnidades(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input placeholder="Rua das Flores, 123" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input placeholder="São Paulo" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input placeholder="SP" value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Condomínio"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por nome do condomínio..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
          {(['todos', 'critico', 'atencao', 'em_dia'] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize whitespace-nowrap"
            >
              {s.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Condominios Grid */}
      <div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Sincronizando condomínios...</p>
          </div>
        ) : filteredCondos?.length === 0 ? (
          <Card className="p-20 text-center border-dashed bg-muted/20">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/40 mb-6" />
            <h3 className="text-xl font-bold mb-2">Nada por aqui</h3>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Nenhum condomínio encontrado com os filtros atuais.
            </p>
            <Button onClick={() => { setStatusFilter("todos"); setSearchTerm(""); }}>
              Limpar Filtros
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCondos?.map((condo) => {
              const statusKey = getCondoStatus(condo.id) as keyof typeof statusConfig;
              const status = statusConfig[statusKey];
              const obrigacoesCondo = obrigacoes?.filter((o) => o.condominio_id === condo.id) ?? [];
              const alerts = obrigacoesCondo.filter((o) => o.status !== "em_dia").length;

              return (
                <Card key={condo.id} className="hover:shadow-xl hover:border-primary/40 transition-all duration-300 group relative overflow-hidden bg-card/60">
                  <div className={`absolute top-0 left-0 w-1 h-full ${statusKey === 'critico' ? 'bg-red-500' :
                    statusKey === 'atencao' ? 'bg-orange-500' : 'bg-emerald-500'
                    }`} />
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-inner uppercase">
                          {condo.nome.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{condo.nome}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {condo.endereco ? condo.endereco : "Endereço não cadastrado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusKey === 'critico' ? 'bg-red-500 animate-pulse' :
                          statusKey === 'atencao' ? 'bg-orange-500' : 'bg-emerald-500'
                          }`} />
                        <span className="text-xs font-bold uppercase tracking-wider">{status.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {condo.numero_unidades ?? 0}</span>
                        <span className={`flex items-center gap-1.5 ${alerts > 0 ? 'text-orange-500' : ''}`}><AlertTriangle className="h-3.5 w-3.5" /> {alerts}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full font-bold shadow-sm group-hover:shadow-md transition-all"
                      onClick={() => navigate(`/condominios/${condo.id}`)}
                    >
                      Painel do Condomínio <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
