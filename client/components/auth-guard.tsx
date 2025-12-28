"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isHydrated && !isCheckingAuth && (!isAuthenticated || !user)) {
      router.push("/login");
    }
  }, [mounted, isHydrated, isCheckingAuth, isAuthenticated, user, router]);

  if (!mounted || !isHydrated || isCheckingAuth) {
    // Optionally return a loading spinner here
    return null;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}
