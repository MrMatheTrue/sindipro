import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Bell, Moon } from "lucide-react";

const Configuracoes = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Configurações</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" /> Perfil
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input defaultValue={user?.user_metadata?.full_name || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input defaultValue={user?.email || ""} disabled />
                        </div>
                        <Button>Salvar Alterações</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" /> Segurança
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline">Alterar Senha</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" /> Notificações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span>Notificações Push</span>
                            <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Alertas por e-mail</span>
                            <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Configuracoes;
