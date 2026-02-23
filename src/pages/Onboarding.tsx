import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, CheckCircle, ArrowRight } from "lucide-react";

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Step 1: Profile
    const [phone, setPhone] = useState("");

    // Step 2: First Condominio
    const [condoNome, setCondoNome] = useState("");
    const [address, setAddress] = useState("");

    const handleNext = async () => {
        if (step === 1) {
            const { error } = await supabase.from("profiles").update({ phone }).eq("id", user?.id);
            if (error) {
                toast({ variant: "destructive", title: "Erro", description: error.message });
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!condoNome) {
                toast({ variant: "destructive", title: "Erro", description: "Nome do condomínio é obrigatório" });
                return;
            }
            const { error } = await supabase.from("condominios").insert({
                nome: condoNome,
                endereco: address,
                sindico_id: user?.id
            });
            if (error) {
                toast({ variant: "destructive", title: "Erro", description: error.message });
                return;
            }
            setStep(3);
        } else {
            navigate("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`h-1.5 w-12 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
                        ))}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {step === 1 && "Complete seu Perfil"}
                        {step === 2 && "Seu Primeiro Condomínio"}
                        {step === 3 && "Tudo Pronto!"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-4 mb-4">
                                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center relative group cursor-pointer border-2 border-dashed border-primary/30">
                                    <User className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <p className="text-xs text-muted-foreground">Clique para enviar uma foto</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone / WhatsApp</Label>
                                <Input placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3 mb-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <p className="text-sm">Precisamos de pelo menos um condomínio para começar.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Nome do Condomínio</Label>
                                <Input placeholder="Ex: Residencial Solar" value={condoNome} onChange={(e) => setCondoNome(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Endereço Cortesia</Label>
                                <Input placeholder="Rua, Número, Bairro" value={address} onChange={(e) => setAddress(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-2">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <p className="text-muted-foreground italic">
                                "O SíndicoOS está pronto para transformar sua gestão. Você agora tem controle total sobre obrigações e documentos."
                            </p>
                            <div className="grid grid-cols-1 gap-2 text-left text-sm mt-4">
                                <div className="flex gap-2 items-center"><ArrowRight className="h-3 w-3 text-primary" /> Painel macro de condomínios</div>
                                <div className="flex gap-2 items-center"><ArrowRight className="h-3 w-3 text-primary" /> Assistente IA para consultas rápidas</div>
                                <div className="flex gap-2 items-center"><ArrowRight className="h-3 w-3 text-primary" /> Gestão de zeladores e operacionais</div>
                            </div>
                        </div>
                    )}

                    <Button className="w-full h-12 text-lg font-bold" onClick={handleNext}>
                        {step === 3 ? "Começar Agora" : "Continuar"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Onboarding;
