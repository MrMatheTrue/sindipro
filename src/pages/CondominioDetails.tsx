import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, FileText, Users, ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";

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

    const { data: obrigacoesCount } = useQuery({
        queryKey: ["obrigacoes-count", id],
        queryFn: async () => {
            const { count, error } = await supabase.from("obrigacoes").select("*", { count: 'exact', head: true }).eq("condominio_id", id);
            return count ?? 0;
        }
    });

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
    if (!condo) return <div className="p-8 text-center font-bold">Condomínio não encontrado.</div>;

    const modules = [
        { title: "Obrigações", icon: Calendar, url: `/condominios/${id}/obrigacoes`, color: "text-orange-500", desc: "Controle de AVCB, Seguros, Limpezas" },
        { title: "Documentos", icon: FileText, url: `/condominios/${id}/documentos`, color: "text-blue-500", desc: "Atas, Apólices e Documentos" },
        { title: "Check-in", icon: ClipboardCheck, url: `/condominios/${id}/checkin`, color: "text-green-500", desc: "Zeladoria e Manutenção" },
        { title: "Equipe", icon: Users, url: `/condominios/${id}/equipe`, color: "text-purple-500", desc: "Moradores e Funcionários" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full shadow-sm">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{condo.nome}</h1>
                        <p className="text-muted-foreground">{condo.endereco || "Endereço não cadastrado"}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Users className="mr-2 h-4 w-4" /> Gerenciar Equipe</Button>
                    <Button onClick={() => navigate(`/ia`)}><Building2 className="mr-2 h-4 w-4" /> Falar com IA</Button>
                </div>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-blue-500/5">
                    <CardContent className="p-6">
                        <div className="text-blue-500 mb-2 italic text-xs font-bold uppercase">Unidades</div>
                        <div className="text-3xl font-bold">{condo.numero_unidades || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-500/5">
                    <CardContent className="p-6">
                        <div className="text-orange-500 mb-2 italic text-xs font-bold uppercase">Obrigações</div>
                        <div className="text-3xl font-bold">{obrigacoesCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-500/5">
                    <CardContent className="p-6">
                        <div className="text-green-500 mb-2 italic text-xs font-bold uppercase">Check-in Hoje</div>
                        <div className="text-3xl font-bold">0/0</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-purple-500/5">
                    <CardContent className="p-6">
                        <div className="text-purple-500 mb-2 italic text-xs font-bold uppercase">Membros</div>
                        <div className="text-3xl font-bold">1</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Modules Grid */}
            <h2 className="text-xl font-bold font-display px-1">Módulos de Gestão</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {modules.map((m) => (
                    <Card key={m.title} className="group hover:border-primary/50 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl bg-card/40 backdrop-blur-sm" onClick={() => navigate(m.url)}>
                        <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-6">
                            <div className={`p-6 rounded-2xl bg-card border shadow-inner group-hover:scale-110 transition-transform duration-300 ${m.color}`}>
                                <m.icon className="h-10 w-10" />
                            </div>
                            <div className="space-y-2">
                                <span className="text-xl font-bold block">{m.title}</span>
                                <span className="text-sm text-muted-foreground block line-clamp-1">{m.desc}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default CondominioDetails;
