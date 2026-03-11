import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

/* ======================
   RUNTIME CHECK
====================== */

if (!SECRET_KEY) {
  console.error("🚨 SECRET_KEY is undefined. Check your .env file.");
} else {
  console.log("✅ crypto.js loaded. SECRET_KEY detected.");
}

/* ======================
   ENCRYPT
====================== */

export const encryptToken = (token) => {
  console.log("🔐 encryptToken called");
  console.log("Token before encrypt:", token);

  if (!token) {
    console.warn("⚠️ encryptToken received empty token");
    return null;
  }

  const encrypted = CryptoJS.AES.encrypt(token, SECRET_KEY).toString();

  console.log("Encrypted token:", encrypted);

  return encrypted;
};

/* ======================
   DECRYPT
====================== */

export const decryptToken = (encryptedToken) => {
  console.log("🔥 decryptToken function executing");
  console.log("Encrypted token received:", encryptedToken);

  if (!encryptedToken) {
    console.warn("⚠️ decryptToken received undefined/null token");
    return null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    console.log("Decrypted token:", decrypted);

    return decrypted || null;
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    return null;
  }
};