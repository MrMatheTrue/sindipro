import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Documentos = () => {
    const { id } = useParams();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: docs, isLoading } = useQuery({
        queryKey: ["documentos", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("documentos").select("*").eq("condominio_id", id);
            if (error) throw error;
            return data;
        },
    });

    const filteredDocs = docs?.filter(d => d.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Documentos</h1>
                <Button><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar documentos..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs?.map((doc) => (
                    <Card key={doc.id} className="hover:border-primary/30 transition-colors">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{doc.nome}</p>
                                <p className="text-xs text-muted-foreground">{doc.tipo_documento || "Documento"}</p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                                <a href={doc.arquivo_url || doc.drive_url} target="_blank" rel="noreferrer">
                                    {doc.fonte === 'upload' ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {filteredDocs?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        Nenhum documento encontrado.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documentos;
