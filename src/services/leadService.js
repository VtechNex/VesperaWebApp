import API from "../utils/utils";
import apiClient, { normalizeApiError } from "./apiClient";

function buildLeadQueryParams(filters = {}) {
  const params = new URLSearchParams();
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "");

  for (const [key, value] of entries) {
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function validateLeadPayload(leadData) {
  if (!leadData?.fname || !leadData?.mobile || !leadData?.list_id) {
    return {
      status: 400,
      data: { message: "First name, mobile, and list are required" },
    };
  }

  return null;
}

async function createLead(leadData) {
  const validationError = validateLeadPayload(leadData);
  if (validationError) return validationError;

  try {
    const response = await apiClient.post(API.LEADS, leadData);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to create lead");
  }
}

async function fetchLeadPage(filters = {}) {
  try {
    const response = await apiClient.get(`${API.LEADS}${buildLeadQueryParams(filters)}`);
    return { status: response.status, data: response.data };
  } catch (error) {
    const normalized = normalizeApiError(error, "Failed to fetch leads");
    return {
      ...normalized,
      data: {
        ...normalized.data,
        data: normalized.data?.data || [],
        pagination: normalized.data?.pagination || {
          page: 1,
          limit: Number(filters.limit || 25),
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    };
  }
}

async function fetchAllLeads(filters = {}) {
  try {
    const response = await apiClient.get(`${API.LEADS}/all${buildLeadQueryParams(filters)}`);
    return { status: response.status, data: response.data };
  } catch (error) {
    const normalized = normalizeApiError(error, "Failed to fetch all leads");
    return {
      ...normalized,
      data: {
        ...normalized.data,
        data: normalized.data?.data || [],
      },
    };
  }
}

async function deleteLead(leadId) {
  try {
    const response = await apiClient.delete(`${API.LEADS}/${leadId}`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to delete lead");
  }
}

async function fetchLeadsByListId(listId) {
  try {
    const response = await apiClient.get(`${API.LEADS}/list/${listId}`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch leads by list");
  }
}

async function getLeadById(leadId) {
  try {
    const response = await apiClient.get(`${API.LEADS}/${leadId}`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch lead");
  }
}

async function updateLead(leadId, leadData) {
  try {
    const response = await apiClient.put(`${API.LEADS}/${leadId}`, leadData);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to update lead");
  }
}

async function searchLeads(query) {
  try {
    const response = await apiClient.post(`${API.LEADS}/search`, { query });
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to search leads");
  }
}

async function exportLeads(filters = {}) {
  try {
    const response = await apiClient.get(`${API.LEADS}/export${buildLeadQueryParams(filters)}`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to export leads");
  }
}

const LEADS = {
  CREATE: createLead,
  FETCH_PAGE: fetchLeadPage,
  FETCH_ALL: fetchAllLeads,
  FETCH_BY_LIST: fetchLeadsByListId,
  GET_BY_ID: getLeadById,
  UPDATE: updateLead,
  DELETE: deleteLead,
  SEARCH: searchLeads,
  EXPORT: exportLeads,
};

export default LEADS;
