import API from "../utils/utils";
import apiClient, { normalizeApiError } from "./apiClient";

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

async function fetchAllLeads() {
  try {
    const response = await apiClient.get(API.LEADS);
    return { status: response.status, data: response.data };
  } catch (error) {
    const normalized = normalizeApiError(error, "Failed to fetch leads");
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

async function exportLeads() {
  try {
    const response = await apiClient.get(`${API.LEADS}/export`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to export leads");
  }
}

const LEADS = {
  CREATE: createLead,
  FETCH_ALL: fetchAllLeads,
  FETCH_BY_LIST: fetchLeadsByListId,
  GET_BY_ID: getLeadById,
  UPDATE: updateLead,
  DELETE: deleteLead,
  SEARCH: searchLeads,
  EXPORT: exportLeads,
};

export default LEADS;
