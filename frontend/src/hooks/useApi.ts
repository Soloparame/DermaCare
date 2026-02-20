"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiError } from "@/lib/api";

export function useApi() {
  const router = useRouter();

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("derma_token");
  }, []);

  const fetch = useCallback(
    async <T, B = unknown>(
      path: string,
      options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: B } = {}
    ): Promise<T> => {
      const token = getToken();
      if (!token) {
        router.push("/auth/login");
        throw new Error("Not authenticated");
      }
      try {
        return await apiFetch<T, B>(path, {
          ...options,
          token,
        });
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.status === 401) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("derma_token");
            window.localStorage.removeItem("derma_role");
            router.push("/auth/login");
          }
          throw new Error("Session expired. Please sign in again.");
        }
        throw err;
      }
    },
    [getToken, router]
  );

  return { fetch, getToken };
}
