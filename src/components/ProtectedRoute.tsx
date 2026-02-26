import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, isColaborador, user } = useAuth();

  // Check colaborador access status
  const { data: acesso, isLoading: acessoLoading } = useQuery({
    queryKey: ["meu-acesso-guard", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("condominio_acessos")
        .select("status, condominio_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && isColaborador,
  });

  if (loading || (isColaborador && acessoLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Colaborador with no access record yet → select condo
  if (isColaborador && !acesso) {
    return <Navigate to="/selecionar-condominio" replace />;
  }

  // Colaborador pending or rejected → waiting screen
  if (isColaborador && acesso && acesso.status !== "aprovado") {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  return <>{children}</>;
}
