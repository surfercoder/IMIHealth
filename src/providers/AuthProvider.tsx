import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  signOut: () => Promise<void>;
}

interface AuthState {
  session: Session | null;
  initialized: boolean;
}

type AuthAction = { type: "hydrate"; session: Session | null };

function reducer(_state: AuthState, action: AuthAction): AuthState {
  return { session: action.session, initialized: true };
}

const initialAuthState: AuthState = { session: null, initialized: false };

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  initialized: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialAuthState);
  const { session, initialized } = state;

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      dispatch({ type: "hydrate", session: data.session ?? null });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      dispatch({ type: "hydrate", session: s });
    });

    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      initialized,
      signOut,
    }),
    [session, initialized, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return use(AuthContext);
}
