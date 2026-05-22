import API from "../utils/utils";
import apiClient, { normalizeApiError } from "./apiClient";

async function createQualifier(qualifierData) {
  try {
    return await apiClient.post(API.QUALIFIERS, qualifierData);
  } catch (error) {
    return normalizeApiError(error, "Failed to create qualifier");
  }
}

async function fetchQualifiers(type) {
  try {
    return await apiClient.get(API.QUALIFIERS, {
      params: type ? { type } : {},
    });
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch qualifiers");
  }
}

async function getQualifierById(id) {
  try {
    return await apiClient.get(`${API.QUALIFIERS}/${id}`);
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch qualifier");
  }
}

async function updateQualifier(id, data) {
  try {
    return await apiClient.put(`${API.QUALIFIERS}/${id}`, data);
  } catch (error) {
    return normalizeApiError(error, "Failed to update qualifier");
  }
}

async function deleteQualifier(id) {
  try {
    return await apiClient.delete(`${API.QUALIFIERS}/${id}`);
  } catch (error) {
    return normalizeApiError(error, "Failed to delete qualifier");
  }
}

const QUALIFIERS = {
  CREATE: createQualifier,
  FETCH_ALL: fetchQualifiers,
  GET_BY_ID: getQualifierById,
  UPDATE: updateQualifier,
  DELETE: deleteQualifier,
};

export default QUALIFIERS;
