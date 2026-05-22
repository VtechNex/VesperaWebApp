import API from "../utils/utils";
import apiClient, { getStoredSession } from "./apiClient";
import { encryptToken } from "../utils/crypto";

const STORAGE_KEY = "user";

const getUser = () => {
  const session = getStoredSession();
  return session?.user || null;
};

const getAuthToken = () => {
  const session = getStoredSession();
  return session?.token || null;
};

const setUser = (user) => {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

const login = async (email, password) => {
  const response = await apiClient.post(`${API.AUTH}/log`, { email, password });
  const { token, user } = response.data || {};

  if (!token || !user) {
    throw new Error("Invalid login response");
  }

  setUser({
    ...user,
    token: encryptToken(token),
  });

  return response;
};

const logout = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const me = async () => apiClient.get(`${API.AUTH}/me`);

const AUTH = {
  LOGIN: login,
  LOGOUT: logout,
  USER: getUser,
  GET_TOKEN: getAuthToken,
  SET_USER: setUser,
  ME: me,
};

export default AUTH;
