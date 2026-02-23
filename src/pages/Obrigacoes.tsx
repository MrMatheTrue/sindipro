import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle } from "lucide-react";

const Obrigacoes = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: obrigacoes, isLoading } = useQuery({
        queryKey: ["obrigacoes", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("obrigacoes").select("*").eq("condominio_id", id);
            if (error) throw error;
            return data;
        },
    });

    const registerRealization = useMutation({
        mutationFn: async (obrigacaoId: string) => {
            // Simplification: update last realization to today and recalculate next
            const now = new Date();
            const nextDate = new Date();
            // Assume periodicidade_dias exists, default 365
            const { data: current } = await supabase.from("obrigacoes").select("periodicidade_dias").eq("id", obrigacaoId).single();
            nextDate.setDate(now.getDate() + (current?.periodicidade_dias || 365));

            const { error } = await supabase.from("obrigacoes").update({
                data_ultima_realizacao: now.toISOString().split('T')[0],
                data_proxima_realizacao: nextDate.toISOString().split('T')[0],
                status: 'em_dia'
            }).eq("id", obrigacaoId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["obrigacoes", id] });
            toast({ title: "Realização registrada com sucesso!" });
        },
    });

    if (isLoading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Obrigações</h1>
                <Button><Plus className="mr-2 h-4 w-4" /> Nova Obrigação</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Última Realização</TableHead>
                                <TableHead>Próxima Data</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {obrigacoes?.map((o) => (
                                <TableRow key={o.id}>
                                    <TableCell className="font-medium">{o.nome}</TableCell>
                                    <TableCell>{o.data_ultima_realizacao || "-"}</TableCell>
                                    <TableCell>{o.data_proxima_realizacao || "-"}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${o.status === "vencida" ? "bg-red-500/10 text-red-500" :
                                                o.status === "atencao" ? "bg-yellow-500/10 text-yellow-500" :
                                                    "bg-green-500/10 text-green-500"
                                            }`}>
                                            {o.status.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => registerRealization.mutate(o.id)}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Registrar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {obrigacoes?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhuma obrigação cadastrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default Obrigacoes;
