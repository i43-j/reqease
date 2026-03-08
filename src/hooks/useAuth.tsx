import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { isEmailAllowed } from "@/config/allowlist";

const GOOGLE_CLIENT_ID = "1046933974455-7i13vt52b0madshv0s3sf9te9cks2t8a.apps.googleusercontent.com";
const STORAGE_KEY = "shap_user";

export interface AppUser {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  // Handle Google credential response
  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    try {
      const payload = decodeJwtPayload(response.credential);
      const email = (payload.email as string) ?? "";
      
      if (!isEmailAllowed(email)) {
        alert("Access denied. Only @shap.edu.ph accounts or allowlisted emails are permitted.");
        return;
      }

      const appUser: AppUser = {
        email,
        name: (payload.name as string) ?? email,
        picture: (payload.picture as string) ?? "",
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      setUser(appUser);
    } catch (e) {
      console.error("Failed to decode Google token:", e);
    }
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google?.accounts?.id) {
        // Script not loaded yet, retry
        setTimeout(initGoogle, 100);
        return;
      }

      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });
    };

    initGoogle();
  }, [handleCredentialResponse]);

  const signInWithGoogle = useCallback(() => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
