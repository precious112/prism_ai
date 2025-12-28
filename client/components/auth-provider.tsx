"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setCheckingAuth = useAuthStore((state) => state.setCheckingAuth);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isHydrated || initialized.current) return;
    initialized.current = true;

    const checkAuth = async () => {
      // If we already have a token, we're good (though we might want to validate it,
      // but usually we rely on api interceptors for that).
      // However, since we don't persist token, on reload token is null.
      if (!token) {
        try {
          const response = await api.post("/auth/refresh");
          const { accessToken } = response.data.data;
          
          if (accessToken && user) {
            login(accessToken, user);
          } else {
            // If we don't have a user but refreshed successfully, we might need to fetch user profile
            // But for now, let's assume we rely on persisted user or logout if missing
             if (accessToken) {
                 // Potentially fetch user here if needed: const me = await api.get('/users/me');
                 // login(accessToken, me.data);
                 // For now, if user is missing but we have token, we can't fully login without user object
                 // logic in login action requires user. 
                 // If we strictly follow the plan, user is persisted.
                 logout();
             } else {
                 logout();
             }
          }
        } catch (error) {
          // If refresh fails, we are not logged in
          logout();
        }
      }
      
      setCheckingAuth(false);
    };

    checkAuth();
  }, [token, user, login, logout, setCheckingAuth, isHydrated]);

  return <>{children}</>;
}
