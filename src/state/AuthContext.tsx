import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Membership = {
  id: string;
  group_id: string;
  role: string;
  permission_level: string;
  financial_groups: { id: string; name: string; owner_id: string } | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  membership: Membership | null;
  loading: boolean;
  refreshMembership: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMembership = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setMembership(null);
    const { data } = await supabase.from("group_members")
      .select("id, group_id, role, permission_level, financial_groups(id, name, owner_id)")
      .eq("user_id", auth.user.id).limit(1).maybeSingle();
    setMembership(data as Membership | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await refreshMembership();
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setMembership(null);
      else setTimeout(() => void refreshMembership(), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => ({
    session, user: session?.user ?? null, membership, loading, refreshMembership,
    signOut: async () => { await supabase.auth.signOut(); }
  }), [session, membership, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return value;
}
