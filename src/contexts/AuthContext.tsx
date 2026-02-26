import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: Profile | null;
  isSindico: boolean;
  isColaborador: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ✅ FIX: default isSindico: false — evita flash de acesso indevido durante loading
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  profile: null,
  isSindico: false,
  isColaborador: false,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        // Fallback sem coluna role
        const { data: fb } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url")
          .eq("id", userId)
          .maybeSingle();
        if (fb) {
          const p = { ...fb, role: "sindico" } as Profile;
          setProfile(p);
          return p;
        }
        return null;
      }

      // Se role vier null do banco, assume sindico (dados antigos)
      const p = { ...data, role: data.role ?? "sindico" } as Profile;
      setProfile(p);
      return p;
    } catch (err) {
      console.error("fetchProfile error:", err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);

        if (currentSession?.user) {
          // Aplicar pending_role vindo de OAuth (localStorage)
          const pendingRole = localStorage.getItem("pending_role");
          if (pendingRole) {
            try {
              await supabase.from("profiles").upsert({
                id: currentSession.user.id,
                role: pendingRole,
                full_name: currentSession.user.user_metadata?.full_name ?? "",
                email: currentSession.user.email ?? "",
              });
              localStorage.removeItem("pending_role");
            } catch (err) {
              console.error("Error applying pending role:", err);
            }
          }

          const loadedProfile = await fetchProfile(currentSession.user.id);

          // ✅ FIX: Redirecionar usuário OAuth novo para o fluxo correto
          if (event === "SIGNED_IN" && loadedProfile) {
            const isNew = (() => {
              try {
                const created = new Date(currentSession.user.created_at).getTime();
                return Date.now() - created < 60_000; // criado há menos de 60s
              } catch { return false; }
            })();

            if (isNew) {
              if (loadedProfile.role === "colaborador") {
                window.location.href = "/selecionar-condominio";
              } else if (loadedProfile.role === "sindico") {
                // Verificar se já tem condomínio
                const { count } = await supabase
                  .from("condominios")
                  .select("id", { count: "exact", head: true })
                  .eq("sindico_id", currentSession.user.id);
                if (!count || count === 0) {
                  window.location.href = "/onboarding";
                }
              }
            }
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("signOut error:", error);
    } finally {
      setProfile(null);
      setSession(null);
    }
  };

  // ✅ FIX: isSindico = false enquanto loading para evitar acesso prematuro
  const isSindico = !!profile && (
    profile.role === "sindico" ||
    profile.role === "admin" ||
    profile.role === "zelador" ||
    profile.role === "funcionario"
  );
  const isColaborador = !!profile && profile.role === "colaborador";

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      profile,
      isSindico,
      isColaborador,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}