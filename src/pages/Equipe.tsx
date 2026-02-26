import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, Trash2, Loader2, ShieldAlert, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Equipe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: equipe, isLoading, isError } = useQuery({
        queryKey: ["equipe", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("condominio_acessos")
                .select("*, profile:profiles(full_name, email, avatar_url, role)")
                .eq("condominio_id", id);
            if (error) throw error;
            return data;
        },
        retry: 1,
        enabled: !!id,
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
        onError: (err: any) => toast({ variant: "destructive", title: "Erro", description: err.message }),
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Carregando equipe...</p>
        </div>
    );

    if (isError) return (
        <div className="p-8 text-center space-y-4">
            <p className="font-bold text-destructive">Erro ao carregar equipe.</p>
            <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
    );

    const MemberCard = ({ m, showActions }: { m: any; showActions: boolean }) => (
        <Card className="border-none shadow-sm bg-card/60">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary shrink-0 uppercase">
                    {(m.profile as any)?.full_name?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{(m.profile as any)?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {(m.profile as any)?.email ?? "—"}
                    </p>
                </div>
                {showActions && (
                    <div className="flex gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => aprovarMutation.mutate(m.id)}
                            disabled={aprovarMutation.isPending}
                        >
                            <UserCheck className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-500/10"
                            onClick={() => recusarMutation.mutate(m.id)}
                            disabled={recusarMutation.isPending}
                        >
                            <UserX className="h-4 w-4 mr-1" /> Recusar
                        </Button>
                    </div>
                )}
                {!showActions && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => removerMutation.mutate(m.id)}
                        disabled={removerMutation.isPending}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                {/* ✅ FIX: navigate(-1) */}
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
                    <p className="text-muted-foreground mt-1">Gerencie colaboradores e solicitações de acesso.</p>
                </div>
            </div>

            {pendentes.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        <h2 className="font-bold text-lg">Solicitações Pendentes ({pendentes.length})</h2>
                    </div>
                    <div className="space-y-3">
                        {pendentes.map((m) => <MemberCard key={m.id} m={m} showActions={true} />)}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="font-bold text-lg">Membros Ativos ({aprovados.length})</h2>
                </div>
                {aprovados.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="font-bold">Nenhum colaborador ativo</p>
                        <p className="text-sm text-muted-foreground mt-1">Colaboradores aprovados aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {aprovados.map((m) => <MemberCard key={m.id} m={m} showActions={false} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Equipe;