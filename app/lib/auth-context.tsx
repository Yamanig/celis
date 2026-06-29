import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { fetchCurrentUser, signOut } from "~/server/auth.functions";
import type { CurrentUser } from "~/server/auth.server";

interface AuthContextValue {
  user: CurrentUser | null | undefined;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: CurrentUser | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<CurrentUser | null | undefined>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const current = await fetchCurrentUser();
      setUser(current);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    navigate({ to: "/" });
  }, [navigate]);

  useEffect(() => {
    // Revalidate auth when window regains focus in case session changed in another tab.
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
