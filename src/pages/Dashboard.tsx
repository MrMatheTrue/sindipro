import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, AlertTriangle, ClipboardCheck, FileText, Plus, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const statusConfig = {
  critico: { label: "Crítico", className: "bg-destructive/15 text-destructive border-destructive/30" },
  atencao: { label: "Atenção", className: "bg-warning/15 text-warning border-warning/30" },
  em_dia: { label: "Em dia", className: "bg-success/15 text-success border-success/30" },
} as const;

const Dashboard = () => {
  const { user } = useAuth();
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

      {/* Condomínios Filters */}
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

      {/* Condomínios Grid */}
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
