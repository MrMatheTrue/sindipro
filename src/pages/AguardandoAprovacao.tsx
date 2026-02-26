import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Clock, Building2, CheckCircle2, LogOut, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AguardandoAprovacao = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: acesso, refetch, isLoading } = useQuery({
        queryKey: ["meu-acesso", user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from("condominio_acessos")
                .select("*, condominio:condominios(nome, endereco)")
                .eq("user_id", user!.id)
                .maybeSingle();
            return data;
        },
        enabled: !!user,
        refetchInterval: 15000, // Poll every 15s
    });

    useEffect(() => {
        if (acesso?.status === "aprovado") {
            toast({ title: "Acesso aprovado!", description: "Bem-vindo à equipe!" });
            refreshProfile();
            navigate("/dashboard");
        }
    }, [acesso?.status]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    const condoNome = (acesso?.condominio as any)?.nome || "condomínio selecionado";

    if (!acesso && !isLoading) {
        // No access record found — redirect to select condo
        navigate("/selecionar-condominio");
        return null;
    }

    const isRecusado = acesso?.status === "recusado";

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-sm w-full text-center space-y-8">
                <div className="flex items-center justify-center gap-2">
                    <Building2 className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold">SíndicoOS</span>
                </div>

                {isRecusado ? (
                    <>
                        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <LogOut className="h-12 w-12 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Acesso Recusado</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Sua solicitação de acesso ao <strong>{condoNome}</strong> foi recusada pelo síndico.
                                Entre em contato com o síndico ou selecione outro condomínio.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <Button className="w-full" onClick={() => navigate("/selecionar-condominio")}>
                                Selecionar outro condomínio
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" /> Sair
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Clock className="h-12 w-12 text-primary animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 left-0 flex justify-center">
                                <div className="h-3 w-3 rounded-full bg-amber-500 animate-bounce" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Aguardando Aprovação</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Sua solicitação para o <strong>{condoNome}</strong> foi enviada.
                                O síndico receberá uma notificação e precisará aprovar seu acesso.
                            </p>
                        </div>

                        <div className="bg-muted/40 rounded-2xl p-5 space-y-3 text-left border border-dashed">
                            <div className="flex items-center gap-3 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Conta criada com sucesso</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Condomínio selecionado: <strong>{condoNome}</strong></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>Aguardando aprovação do síndico…</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button variant="outline" className="w-full" onClick={() => refetch()}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Verificar status
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" /> Sair
                            </Button>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                            Esta página verifica automaticamente a cada 15 segundos.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AguardandoAprovacao;
