import axios from "axios";
import { decryptToken } from "../utils/crypto";

const apiClient = axios.create({
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getStoredSession() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    const token = decryptToken(parsed.token);
    if (!token) return null;
    return { user: parsed, token };
  } catch (error) {
    console.error("Failed to parse stored session", error);
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const session = getStoredSession();
  if (session?.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("vespera:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export function normalizeApiError(error, fallbackMessage = "Something went wrong") {
  return {
    status: error?.response?.status || 500,
    data: {
      ...(error?.response?.data || {}),
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallbackMessage,
    },
  };
}

export default apiClient;
