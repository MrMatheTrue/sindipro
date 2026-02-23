import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CheckIn = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: tarefas, isLoading } = useQuery({
        queryKey: ["tarefas-checkin", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("tarefas_checkin").select("*").eq("condominio_id", id).eq("status_ativo", true);
            if (error) throw error;
            return data;
        },
    });

    const { data: execucoes } = useQuery({
        queryKey: ["execucoes-hoje", id],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from("execucoes_checkin")
                .select("*")
                .eq("condominio_id", id)
                .gte("data_execucao", today);
            if (error) throw error;
            return data;
        },
    });

    const completeTarefa = useMutation({
        mutationFn: async (tarefaId: string) => {
            const { error } = await supabase.from("execucoes_checkin").insert({
                tarefa_id: tarefaId,
                condominio_id: id,
                executado_por: (await supabase.auth.getUser()).data.user?.id,
                status: 'concluida'
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["execucoes-hoje", id] });
            toast({ title: "Tarefa concluída!" });
        },
    });

    if (isLoading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Check-in de Tarefas</h1>

            <div className="space-y-4">
                {tarefas?.map((tarefa) => {
                    const concluida = execucoes?.some(e => e.tarefa_id === tarefa.id && e.status === 'concluida');

                    return (
                        <Card key={tarefa.id} className={concluida ? "opacity-60" : ""}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`p-2 rounded-full ${concluida ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"}`}>
                                    {concluida ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{tarefa.titulo}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {tarefa.horario_previsto || "Sem horário"} · {tarefa.frequencia}
                                    </p>
                                </div>
                                {!concluida && (
                                    <Button size="sm" onClick={() => completeTarefa.mutate(tarefa.id)}>
                                        <Camera className="mr-2 h-4 w-4" /> Concluir
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
                {tarefas?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        Nenhuma tarefa ativa para este condomínio.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckIn;
