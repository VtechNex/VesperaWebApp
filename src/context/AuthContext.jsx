import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import AUTH from "../services/authService";
import { getPermissionsForRole, hasPermission as checkPermission, normalizeRole } from "../permissions";

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
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const channelRef = useRef(null);

  const performLogout = React.useCallback((sync = true, nextAuthError = "") => {
    AUTH.LOGOUT();
    setUser(null);
    setUserProfile(null);
    setStatus("unauthenticated");
    setAuthError(nextAuthError);
    setAuthLoading(false);

    if (sync) {
      const payload = { type: "logout", at: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      channelRef.current?.postMessage(payload);
    }
  }, []);

  const rehydrate = React.useCallback(async () => {
    setStatus("loading");
    setAuthLoading(true);
    setAuthError("");
    const stored = AUTH.USER();
    if (!stored) {
      setUser(null);
      setUserProfile(null);
      setStatus("unauthenticated");
      setAuthLoading(false);
      return { authenticated: false, reason: "missing-session" };
    }

    try {
      const response = await AUTH.ME();
      if (response?.status === 200 && response.data?.data) {
        const mergedUser = { ...stored, ...response.data.data, role: normalizeRole(response.data.data?.role || stored?.role) };
        AUTH.SET_USER(mergedUser);
        setUser(mergedUser);
        setUserProfile(response.data.data);
        setStatus("authenticated");
        return { authenticated: true, user: mergedUser };
      } else {
        performLogout(false);
        return { authenticated: false, reason: "invalid-session-response" };
      }
    } catch (error) {
      console.error("Auth rehydrate failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "We could not refresh your session.";
      performLogout(false, message);
      return { authenticated: false, reason: "request-failed", error };
    } finally {
      setAuthLoading(false);
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

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[AuthContext]", {
        authLoading,
        status,
        user,
        authError,
      });
    }
  }, [authError, authLoading, status, user]);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      userRole: normalizeRole(user?.role),
      permissions: getPermissionsForRole(user?.role),
      status,
      authLoading,
      authError,
      isAuthLoading: authLoading,
      isRoleLoading: authLoading,
      isAuthenticated: status === "authenticated",
      hasPermission: (permissionName) => checkPermission(user?.role, permissionName),
      login: async (email, password) => {
        const response = await AUTH.LOGIN(email, password);
        const refreshResult = await rehydrate();
        if (!refreshResult?.authenticated) {
          throw new Error("Login succeeded, but the session could not be refreshed.");
        }
        return response;
      },
      logout: () => performLogout(true),
      rehydrate,
      refreshAuthState: rehydrate,
    }),
    [authError, authLoading, performLogout, rehydrate, status, user, userProfile]
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
