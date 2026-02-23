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
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [unidades, setUnidades] = useState("");

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("condominios").insert({
        sindico_id: user!.id,
        nome,
        endereco,
        cidade,
        estado,
        numero_unidades: unidades ? parseInt(unidades) : 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominios"] });
      setDialogOpen(false);
      setNome(""); setEndereco(""); setCidade(""); setEstado(""); setUnidades("");
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

  const totalObrigacoesVencendo = obrigacoes?.filter((o) => o.status === "vencida" || o.status === "atencao").length ?? 0;

  const kpis = [
    { label: "Condomínios", value: condominios?.length ?? 0, icon: Building2, color: "text-primary" },
    { label: "Obrigações vencendo", value: totalObrigacoesVencendo, icon: AlertTriangle, color: "text-warning" },
    { label: "Tarefas pendentes", value: 0, icon: ClipboardCheck, color: "text-destructive" },
    { label: "Documentos", value: 0, icon: FileText, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral dos seus condomínios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Condomínio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Condomínio</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Residencial Aurora" value={nome} onChange={(e) => setNome(e.target.value)} required />
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
              <div className="space-y-2">
                <Label>Nº de Unidades</Label>
                <Input type="number" placeholder="48" value={unidades} onChange={(e) => setUnidades(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cadastrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-lg bg-card ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Condomínios Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Seus Condomínios</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : condominios?.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum condomínio cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">Comece cadastrando seu primeiro condomínio.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Cadastrar condomínio
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {condominios?.map((condo) => {
              const statusKey = getCondoStatus(condo.id) as keyof typeof statusConfig;
              const status = statusConfig[statusKey];
              const obrigacoesCondo = obrigacoes?.filter((o) => o.condominio_id === condo.id) ?? [];
              const obrigacoesVencendo = obrigacoesCondo.filter((o) => o.status !== "em_dia").length;

              return (
                <Card key={condo.id} className="hover:border-primary/30 transition-colors group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {condo.nome.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{condo.nome}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[condo.endereco, condo.cidade, condo.estado].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>{condo.numero_unidades ?? 0} unidades</span>
                      <span>·</span>
                      <span>{obrigacoesVencendo} obrigações</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full group-hover:text-primary"
                      onClick={() => navigate(`/condominios/${condo.id}`)}
                    >
                      Acessar <ArrowRight className="ml-1 h-4 w-4" />
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
