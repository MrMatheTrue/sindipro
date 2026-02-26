import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, Trash2, Loader2, ShieldAlert, ArrowLeft, Clock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Equipe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: equipe, isLoading } = useQuery({
        queryKey: ["equipe", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("condominio_acessos")
                .select("*, profile:profiles(full_name, email, avatar_url, role)")
                .eq("condominio_id", id);
            if (error) throw error;
            return data;
        },
    });

    const pendentes = equipe?.filter((m) => m.status === "pendente") ?? [];
    const aprovados = equipe?.filter((m) => m.status === "aprovado") ?? [];

    const aprovarMutation = useMutation({
        mutationFn: async (acessoId: string) => {
            const { error } = await supabase
                .from("condominio_acessos")
                .update({ status: "aprovado" })
                .eq("id", acessoId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipe", id] });
            toast({ title: "Colaborador aprovado!", description: "O colaborador já tem acesso ao condomínio." });
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Erro", description: err.message }),
    });

    const recusarMutation = useMutation({
        mutationFn: async (acessoId: string) => {
            const { error } = await supabase
                .from("condominio_acessos")
                .update({ status: "recusado" })
                .eq("id", acessoId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipe", id] });
            toast({ title: "Solicitação recusada." });
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Erro", description: err.message }),
    });

    const removerMutation = useMutation({
        mutationFn: async (acessoId: string) => {
            const { error } = await supabase.from("condominio_acessos").delete().eq("id", acessoId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipe", id] });
            toast({ title: "Colaborador removido da equipe." });
        },
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Carregando equipe...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Equipe & Acessos</h1>
                    <p className="text-muted-foreground mt-1">Gerencie os colaboradores do seu condomínio.</p>
                </div>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-xl border border-dashed border-blue-500/20 text-sm text-blue-700">
                <strong>Como funciona:</strong> Colaboradores se cadastram na plataforma, selecionam este condomínio e aguardam aqui sua aprovação. Apenas você, como síndico, pode aprovar ou recusar.
            </div>

            {/* Pendentes */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-bold">Solicitações Pendentes</h2>
                    {pendentes.length > 0 && (
                        <span className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                            {pendentes.length}
                        </span>
                    )}
                </div>

                {pendentes.length === 0 ? (
                    <Card className="border-dashed bg-muted/10">
                        <CardContent className="py-8 text-center text-muted-foreground text-sm">
                            Nenhuma solicitação pendente no momento.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {pendentes.map((mem) => (
                            <Card key={mem.id} className="border-amber-500/20 bg-amber-500/5 shadow-sm">
                                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Users className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-base truncate">
                                            {(mem.profile as any)?.full_name || mem.colaborador_nome || "Colaborador"}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Mail className="h-3.5 w-3.5" />
                                            {(mem.profile as any)?.email || "—"}
                                        </p>
                                        <span className="inline-block text-[10px] bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase mt-1">
                                            Aguardando aprovação
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                                            onClick={() => aprovarMutation.mutate(mem.id)}
                                            disabled={aprovarMutation.isPending || recusarMutation.isPending}
                                        >
                                            <UserCheck className="mr-1.5 h-4 w-4" /> Aprovar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                            onClick={() => recusarMutation.mutate(mem.id)}
                                            disabled={aprovarMutation.isPending || recusarMutation.isPending}
                                        >
                                            <UserX className="mr-1.5 h-4 w-4" /> Recusar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Equipe Ativa */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-bold">Equipe Ativa</h2>
                    {aprovados.length > 0 && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                            {aprovados.length}
                        </span>
                    )}
                </div>

                {aprovados.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-muted/20">
                        <ShieldAlert className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-base font-bold uppercase">Nenhum colaborador ativo</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                            Colaboradores aprovados aparecerão aqui. Eles se cadastram e escolhem este condomínio.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {aprovados.map((mem) => (
                            <Card key={mem.id} className="group border-none shadow-sm bg-card/60 backdrop-blur-sm hover:shadow-md transition-all">
                                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <Users className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-base truncate">
                                            {(mem.profile as any)?.full_name || mem.colaborador_nome || "Colaborador"}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Mail className="h-3.5 w-3.5" />
                                            {(mem.profile as any)?.email || "—"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                                            ✓ Ativo
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive opacity-40 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removerMutation.mutate(mem.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Equipe;
