import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authClient, type AuthUser } from "~/utils/authClient";
import {
  getAuthMode,
  setAuthMode,
  clearAuthMode,
  type AuthMode,
} from "~/utils/authMode";
import type { Role, UiUser } from "~/types/auth";

interface AuthContextValue {
  mode: AuthMode;
  user: UiUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);



function mapAuthUserToUi(user: AuthUser): UiUser {
  const initials =
    user.username
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "NC";

  let role: Role = "learner";
  if (user.is_admin) role = "admin";
  else if (user.is_contributor) role = "contributor";

  return {
    id: user.id,
    displayName: user.username,
    avatarInitials: initials,
    role: role,
    level: 5,
    xp: 650,
    nextLevelXp: 1000,
    is_admin: !!user.is_admin,
    is_contributor: !!user.is_contributor,
    gems: user.gems ?? 0,
    current_profile_picture_id: user.current_profile_picture_id,
    current_profile_picture_name: user.current_profile_picture_name
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("none");
  const [user, setUser] = useState<UiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedMode = getAuthMode();



      try {
        const me = await authClient.me();
        if (cancelled) return;

        setMode("real");
        setAuthMode("real");
        setUser(mapAuthUserToUi(me.user));
      } catch {
        if (cancelled) return;
        clearAuthMode();
        setMode("none");
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);



  const logout = async () => {
    if (mode === "real") {
      try {
        await authClient.logout();
      } catch {
      }
    }
    clearAuthMode();
    setMode("none");
    setUser(null);
  };

  const value: AuthContextValue = {
    mode,
    user,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
