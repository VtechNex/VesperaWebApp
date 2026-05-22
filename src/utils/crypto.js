import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

function hasSecret() {
  return typeof SECRET_KEY === "string" && SECRET_KEY.length > 0;
}

export const encryptToken = (token) => {
  if (!token || !hasSecret()) {
    return null;
  }

  return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
};

export const decryptToken = (encryptedToken) => {
  if (!encryptedToken || !hasSecret()) {
    return null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch {
    return null;
  }
};
