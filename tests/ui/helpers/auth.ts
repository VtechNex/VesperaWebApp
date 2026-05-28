import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

type RoleKey = "mainAdmin" | "manager" | "l1" | "l2";

type QaUser = {
  id: string;
  email: string;
  role: string;
  username: string;
  name: string;
};

const API_BASE = "http://127.0.0.1:5000";

const QA_USERS: Record<RoleKey, QaUser> = {
  mainAdmin: {
    id: "0aa19bba-14e6-4863-8175-9b861f680a89",
    email: "vesperaestate@gmail.com",
    role: "MAIN_ADMIN",
    username: "VesperaEstate",
    name: "Vespera Estate",
  },
  manager: {
    id: "92d0a733-6f67-45da-8d8d-475439e5a3f7",
    email: "akramamulani786@gmail.com",
    role: "MANAGER",
    username: "Manager1",
    name: "Manager One",
  },
  l1: {
    id: "bf227566-ba56-4f75-9ef5-6b6377210314",
    email: "akrammulani271@gmail.com",
    role: "L1",
    username: "level1",
    name: "Level 1 QA",
  },
  l2: {
    id: "47eed036-3f01-4205-9ffe-a69d3ff151e6",
    email: "qa.l2.20260524@vespera.local",
    role: "L2",
    username: "qa_l2_20260524",
    name: "QA L2",
  },
};

function readEnvValue(filePath: string, key: string) {
  const envText = fs.readFileSync(filePath, "utf8");
  const line = envText
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) {
    throw new Error(`Missing ${key} in ${filePath}`);
  }

  return line.slice(line.indexOf("=") + 1).trim().replace(/^"|"$/g, "");
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(currentDir, "../../../../VesperaBackend/.env");
const frontendEnvPath = path.resolve(currentDir, "../../../.env");
const jwtSecret = readEnvValue(backendEnvPath, "JWT_SECRET");
const cryptoSecret = readEnvValue(frontendEnvPath, "VITE_SECRET_KEY");

function buildToken(user: QaUser) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "1d" }
  );
}

function encryptToken(token: string) {
  return CryptoJS.AES.encrypt(token, cryptoSecret).toString();
}

export function getQaUser(role: RoleKey) {
  return QA_USERS[role];
}

export function getApiBase() {
  return API_BASE;
}

export async function applyAuthSession(page: Page, role: RoleKey) {
  const user = getQaUser(role);
  const token = buildToken(user);
  const encryptedToken = encryptToken(token);

  await page.addInitScript(
    ({ authUser }) => {
      window.localStorage.setItem("user", JSON.stringify(authUser));
    },
    {
      authUser: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        name: user.name,
        token: encryptedToken,
      },
    }
  );
}

export async function expectAuthed(page: Page, role: RoleKey) {
  await applyAuthSession(page, role);
  const response = await page.goto("/dashboard/admin");
  expect(response?.ok()).toBeTruthy();
}

export async function apiHeadersFor(role: RoleKey) {
  const user = getQaUser(role);
  const token = buildToken(user);
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function apiGet(request: APIRequestContext, role: RoleKey, route: string) {
  return request.get(`${API_BASE}${route}`, { headers: await apiHeadersFor(role) });
}

export async function apiPost(
  request: APIRequestContext,
  role: RoleKey,
  route: string,
  data?: unknown
) {
  return request.post(`${API_BASE}${route}`, {
    headers: await apiHeadersFor(role),
    data,
  });
}

export async function apiPut(
  request: APIRequestContext,
  role: RoleKey,
  route: string,
  data?: unknown
) {
  return request.put(`${API_BASE}${route}`, {
    headers: await apiHeadersFor(role),
    data,
  });
}

export async function apiDelete(request: APIRequestContext, role: RoleKey, route: string) {
  return request.delete(`${API_BASE}${route}`, { headers: await apiHeadersFor(role) });
}
