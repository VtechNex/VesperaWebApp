import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import AUTH from "../services/authService";

const AuthContext = createContext(null);
const STORAGE_KEY = "vespera_auth_event";

function createChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  return new BroadcastChannel("vespera-auth");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const channelRef = useRef(null);

  const performLogout = React.useCallback((sync = true) => {
    AUTH.LOGOUT();
    setUser(null);
    setStatus("unauthenticated");

    if (sync) {
      const payload = { type: "logout", at: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      channelRef.current?.postMessage(payload);
    }
  }, []);

  const rehydrate = React.useCallback(async () => {
    setStatus("loading");
    const stored = AUTH.USER();
    if (!stored) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const response = await AUTH.ME();
      if (response?.status === 200 && response.data?.data) {
        const mergedUser = { ...stored, ...response.data.data };
        AUTH.SET_USER(mergedUser);
        setUser(mergedUser);
        setStatus("authenticated");
      } else {
        performLogout(false);
      }
    } catch (error) {
      performLogout(false);
    }
  }, [performLogout]);

  useEffect(() => {
    channelRef.current = createChannel();

    const handleSync = (event) => {
      const payload = event?.data || (event.key === STORAGE_KEY ? JSON.parse(event.newValue || "{}") : null);
      if (payload?.type === "logout") {
        performLogout(false);
      }
    };

    const handleUnauthorized = () => performLogout(true);

    channelRef.current?.addEventListener("message", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("vespera:unauthorized", handleUnauthorized);

    rehydrate();

    return () => {
      channelRef.current?.removeEventListener("message", handleSync);
      channelRef.current?.close();
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("vespera:unauthorized", handleUnauthorized);
    };
  }, [performLogout, rehydrate]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      login: async (email, password) => {
        const response = await AUTH.LOGIN(email, password);
        await rehydrate();
        return response;
      },
      logout: () => performLogout(true),
      rehydrate,
    }),
    [performLogout, rehydrate, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
