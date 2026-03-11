
const API = {
    AUTH: import.meta.env.VITE_AUTH_API,
    ADMIN: import.meta.env.VITE_ADMIN_API,
    QUALIFIERS: `${import.meta.env.VITE_ADMIN_API}/qualifiers`,
    LISTS: import.meta.env.VITE_LISTS_API,
    LEADS: import.meta.env.VITE_LEADS_API,
    PROPERTIES: import.meta.env.VITE_PROPERTIES_API,
    GLOBAL: import.meta.env.VITE_GLOBAL_API,
}

export default API;
