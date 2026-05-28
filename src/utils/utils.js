export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}

function trimTrailingSlash(value) {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function joinUrl(baseUrl, path) {
  if (!baseUrl) return "";
  return `${trimTrailingSlash(baseUrl)}${path}`;
}

const API_CONFIG = {
  AUTH: { envKey: "VITE_AUTH_API", fallbackPath: "/api/auth" },
  ADMIN: { envKey: "VITE_ADMIN_API", fallbackPath: "/api/admin" },
  LISTS: { envKey: "VITE_LISTS_API", fallbackPath: "/api/lists" },
  LEADS: { envKey: "VITE_LEADS_API", fallbackPath: "/api/leads" },
  PROPERTIES: { envKey: "VITE_PROPERTIES_API", fallbackPath: "/api/properties" },
  GLOBAL: { envKey: "VITE_GLOBAL_API", fallbackPath: "/api/global" },
  SETTINGS: {
    envKey: "VITE_SETTINGS_API",
    fallbackPath: "/api/settings",
    errorLabel: "settings",
  },
};

function resolveApiUrl(key) {
  const config = API_CONFIG[key];
  if (!config) return undefined;

  const explicitUrl = trimTrailingSlash(import.meta.env[config.envKey]);
  if (explicitUrl) {
    return explicitUrl;
  }

  const baseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);
  if (baseUrl) {
    return joinUrl(baseUrl, config.fallbackPath);
  }

  throw new ConfigurationError(
    `Missing ${config.envKey}. Configure ${config.envKey} or VITE_API_BASE_URL so ${config.errorLabel || key.toLowerCase()} requests can be sent.`
  );
}

const API = new Proxy(
  {},
  {
    get(_target, property) {
      if (property === "QUALIFIERS") {
        return `${resolveApiUrl("ADMIN")}/qualifiers`;
      }

      if (typeof property !== "string") {
        return undefined;
      }

      return resolveApiUrl(property);
    },
  }
);

export default API;
