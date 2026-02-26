import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Search, ArrowRight, Loader2, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const SelecionarCondominio = () => {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [selecting, setSelecting] = useState<string | null>(null);

    // If already has approved access, go to dashboard
    useEffect(() => {
        const checkAccess = async () => {
            if (!user) return;
            const { data } = await supabase
                .from("condominio_acessos")
                .select("status")
                .eq("user_id", user.id)
                .single();
            if (data?.status === "aprovado") navigate("/dashboard");
            if (data?.status === "pendente") navigate("/aguardando-aprovacao");
        };
        checkAccess();
    }, [user, navigate]);

    const { data: condominios, isLoading } = useQuery({
        queryKey: ["all-condominios-public"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("condominios")
                .select("id, nome, endereco, cidade, estado")
                .order("nome");
            if (error) throw error;
            return data;
        },
    });

    const filtered = condominios?.filter((c) =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        (c.endereco || "").toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = async (condoId: string, condoNome: string) => {
        if (!user) return;
        setSelecting(condoId);
        try {
            // Check if already requested
            const { data: existing } = await supabase
                .from("condominio_acessos")
                .select("id, status")
                .eq("user_id", user.id)
                .eq("condominio_id", condoId)
                .maybeSingle();

            if (existing) {
                if (existing.status === "aprovado") {
                    navigate("/dashboard");
                    return;
                }
                if (existing.status === "pendente") {
                    navigate("/aguardando-aprovacao");
                    return;
                }
            }

            const { error } = await supabase.from("condominio_acessos").insert({
                condominio_id: condoId,
                user_id: user.id,
                nivel_acesso: "tarefas_only" as any,
                modulos_permitidos: ["checkin", "obrigacoes"] as any,
                status: "pendente",
                colaborador_nome: profile?.full_name || "",
            });

            if (error) throw error;

            toast({
                title: "Solicitação enviada!",
                description: `Aguarde o síndico do "${condoNome}" aprovar seu acesso.`,
            });
            navigate("/aguardando-aprovacao");
        } catch (err: any) {
            toast({ variant: "destructive", title: "Erro", description: err.message });
        } finally {
            setSelecting(null);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-lg space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Building2 className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold">SíndicoOS</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Selecione seu Condomínio</h1>
                    <p className="text-muted-foreground text-sm">
                        Escolha o condomínio onde você trabalha. O síndico receberá uma solicitação de acesso.
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou endereço..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {filtered?.length === 0 && (
                            <Card className="border-dashed">
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium">Nenhum condomínio encontrado</p>
                                    <p className="text-xs mt-1">Tente outro nome ou endereço</p>
                                </CardContent>
                            </Card>
                        )}
                        {filtered?.map((condo) => (
                            <Card
                                key={condo.id}
                                className="group hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => handleSelect(condo.id, condo.nome)}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shrink-0">
                                        {condo.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base font-bold group-hover:text-primary transition-colors truncate">
                                            {condo.nome}
                                        </CardTitle>
                                        {condo.endereco && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {condo.endereco}{condo.cidade ? `, ${condo.cidade}` : ""}{condo.estado ? ` - ${condo.estado}` : ""}
                                            </p>
                                        )}
                                    </div>
                                    {selecting === condo.id ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                                    ) : (
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <p className="text-center text-xs text-muted-foreground">
                    Não encontrou seu condomínio? Peça ao síndico para cadastrá-lo na plataforma.
                </p>

                <Button variant="ghost" className="w-full" onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>
                    Sair
                </Button>
            </div>
        </div>
    );
};

export default SelecionarCondominio;
