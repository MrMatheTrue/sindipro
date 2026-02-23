import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Shield, Mail } from "lucide-react";

const Equipe = () => {
    const { id } = useParams();

    const { data: equipe, isLoading } = useQuery({
        queryKey: ["equipe", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("condominio_acessos")
                .select("*, profile:profiles(full_name, email, avatar_url)")
                .eq("condominio_id", id);
            if (error) throw error;
            return data;
        },
    });

    if (isLoading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Equipe do Condomínio</h1>
                <Button><UserPlus className="mr-2 h-4 w-4" /> Adicionar Membro</Button>
            </div>

            <div className="grid gap-4">
                {equipe?.map((mem) => (
                    <Card key={mem.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                <Users className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{mem.profile?.full_name || "Usuário"}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {mem.profile?.email}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> {mem.nivel_acesso}
                                </span>
                                <Button variant="ghost" size="sm">Editar</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {equipe?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        Nenhum membro da equipe cadastrado para acesso direto.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Equipe;
