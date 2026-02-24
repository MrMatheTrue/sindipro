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
    const [fullName, setFullName] = useState("");

    // Step 2: First Condominio
    const [condoNome, setCondoNome] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [address, setAddress] = useState("");

    const handleNext = async () => {
        if (step === 1) {
            if (!fullName) {
                toast({ variant: "destructive", title: "Erro", description: "Nome completo é obrigatório" });
                return;
            }
            const { error } = await supabase.from("profiles").update({
                full_name: fullName,
                phone
            }).eq("id", user?.id);

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
                cnpj: cnpj,
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
            <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`h-1.5 w-16 rounded-full transition-all duration-300 ${s <= step ? "bg-primary" : "bg-muted"}`} />
                        ))}
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        {step === 1 && "Seja bem-vindo!"}
                        {step === 2 && "Seu primeiro condomínio"}
                        {step === 3 && "Pronto para decolar!"}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                        {step === 1 && "Vamos começar completando seu perfil."}
                        {step === 2 && "Cadastre o condomínio que você gerencia."}
                        {step === 3 && "Sua conta foi configurada com sucesso."}
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-4 mb-2">
                                <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all">
                                    <User className="h-12 w-12 text-primary/40 group-hover:text-primary/60" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                                        <span className="text-[10px] font-bold">MUDAR FOTO</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nome Completo</Label>
                                <Input id="fullName" placeholder="Digite seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">WhatsApp / Telefone</Label>
                                <Input id="phone" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3 mb-2">
                                <Building2 className="h-5 w-5 text-blue-500" />
                                <p className="text-sm text-blue-700 font-medium">Você poderá adicionar outros condomínios depois.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="condoNome">Nome do Condomínio</Label>
                                <Input id="condoNome" placeholder="Ex: Residencial das Palmeiras" value={condoNome} onChange={(e) => setCondoNome(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
                                <Input id="cnpj" placeholder="00.000.000/0001-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço Completo</Label>
                                <Input id="address" placeholder="Av. Paulista, 1000 - SP" value={address} onChange={(e) => setAddress(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-6 py-4">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-2 animate-bounce">
                                <CheckCircle className="h-12 w-12" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-semibold text-lg italic text-foreground">
                                    "Sua gestão acaba de subir de nível."
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Agora você tem acesso ao controle total de obrigações, documentos e equipe.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 text-left bg-muted/30 p-4 rounded-xl border border-border">
                                <div className="flex gap-2 items-center text-sm font-medium"><ArrowRight className="h-4 w-4 text-primary" /> Dashboard macro com status em tempo real</div>
                                <div className="flex gap-2 items-center text-sm font-medium"><ArrowRight className="h-4 w-4 text-primary" /> Chat IA potente para automações</div>
                                <div className="flex gap-2 items-center text-sm font-medium"><ArrowRight className="h-4 w-4 text-primary" /> Gestão de documentos e obrigações</div>
                            </div>
                        </div>
                    )}

                    <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" onClick={handleNext}>
                        {step === 3 ? "Entrar no SINDIPRO" : "Próximo Passo"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Onboarding;
