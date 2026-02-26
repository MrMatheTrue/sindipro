import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string; // 'sindico' | 'colaborador'
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

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  profile: null,
  isSindico: true,
  isColaborador: false,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        // Fallback for missing 'role' column
        const { data: fallbackData } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (fallbackData) {
          setProfile({ ...fallbackData, role: "sindico" } as Profile);
        }
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("fetchProfile error:", err);
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    // Use onAuthStateChange as the single source of truth for session initialization
    // It fires the current session state immediately upon subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);

        if (currentSession?.user) {
          // Apply pending role from OAuth if exists
          const pendingRole = localStorage.getItem("pending_role");
          if (pendingRole) {
            try {
              await supabase.from("profiles").upsert({
                id: currentSession.user.id,
                role: pendingRole,
                full_name: currentSession.user.user_metadata?.full_name || "",
                email: currentSession.user.email || "",
              });
              localStorage.removeItem("pending_role");
            } catch (err) {
              console.error("Error applying pending role:", err);
            }
          }

          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Clear everything just in case
      setProfile(null);
      setSession(null);
    }
  };

  // STRICT defaults: if no profile is loaded yet, the user has NO permissions.
  // This prevents the "flash" of admin access during loading or for guest users.
  const isSindico = !!profile && (profile.role === "sindico" || profile.role === "zelador" || profile.role === "funcionario");
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
