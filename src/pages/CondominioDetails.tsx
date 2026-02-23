import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, FileText, Users, ArrowLeft, ClipboardCheck } from "lucide-react";

const CondominioDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: condo, isLoading } = useQuery({
        queryKey: ["condominio", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("condominios").select("*").eq("id", id).single();
            if (error) throw error;
            return data;
        },
    });

    if (isLoading) return <div className="p-8">Carregando...</div>;
    if (!condo) return <div className="p-8">Condomínio não encontrado.</div>;

    const modules = [
        { title: "Obrigações", icon: Calendar, url: `/condominios/${id}/obrigacoes`, color: "text-orange-500" },
        { title: "Documentos", icon: FileText, url: `/condominios/${id}/documentos`, color: "text-blue-500" },
        { title: "Check-in", icon: ClipboardCheck, url: `/condominios/${id}/checkin`, color: "text-green-500" },
        { title: "Equipe", icon: Users, url: `/condominios/${id}/equipe`, color: "text-purple-500" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{condo.nome}</h1>
                    <p className="text-muted-foreground">{condo.endereco}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {modules.map((m) => (
                    <Card key={m.title} className="hover:border-primary/50 cursor-pointer transition-colors" onClick={() => navigate(m.url)}>
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-4">
                            <div className={`p-4 rounded-full bg-card ${m.color}`}>
                                <m.icon className="h-8 w-8" />
                            </div>
                            <span className="font-semibold">{m.title}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default CondominioDetails;
