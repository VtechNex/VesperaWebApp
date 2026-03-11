import axios from "axios";
import API from "../utils/utils";
import { encryptToken, decryptToken } from "../utils/crypto";

/* ======================
   USER HELPERS
====================== */

const getUser = () => {
  try {
    const user = localStorage.getItem("user");

    if (!user) return null;

    const parsedUser = JSON.parse(user);

    if (typeof parsedUser !== "object" || parsedUser === null) {
      console.warn("Corrupted user object in localStorage");
      return null;
    }

    return parsedUser;
  } catch (error) {
    console.error("Invalid user in localStorage:", error);
    localStorage.removeItem("user"); // cleanup corrupted data
    return null;
  }
};

const getAuthToken = () => {
  const user = getUser();

  if (!user || !user.token) {
    console.warn("No token found in user object");
    return null;
  }

  try {
    const decrypted = decryptToken(user.token);

    if (!decrypted) {
      console.warn("Token decryption returned empty value");
      return null;
    }

    return decrypted;
  } catch (error) {
    console.error("Token decrypt failed:", error);
    return null;
  }
};

/* ======================
   AUTH FUNCTIONS
====================== */

const login = async (email, password) => {
  try {
    const response = await axios.post(
      `${API.AUTH}/log`,
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { token, user } = response.data;

    if (!token || !user) {
      throw new Error("Invalid response from server");
    }

    const encryptedToken = encryptToken(token);

    if (!encryptedToken) {
      throw new Error("Token encryption failed");
    }

    const storedUser = {
      ...user,
      token: encryptedToken,
    };

    localStorage.setItem("user", JSON.stringify(storedUser));

    return response;
  } catch (error) {
    console.error("Login error:", error);

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Server not reachable";

    throw {
      status: error?.response?.status || 500,
      error: message,
    };
  }
};

const logout = () => {
  localStorage.removeItem("user");
};

/* ======================
   EXPORT
====================== */

const AUTH = {
  LOGIN: login,
  LOGOUT: logout,
  USER: getUser,
  GET_TOKEN: getAuthToken,
};

export default AUTH;