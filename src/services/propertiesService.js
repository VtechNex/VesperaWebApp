import API from "../utils/utils";
import apiClient, { normalizeApiError } from "./apiClient";

const getProperties = async (page = 1, limit = 20, filters = {}) => {
  try {
    return await apiClient.get(`${API.PROPERTIES}/all`, {
      params: { page, limit, ...filters },
    });
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch properties");
  }
};

const uploadPropertyImage = async (formData) => {
  try {
    return await apiClient.post(`${API.PROPERTIES}/upload-property-images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    return normalizeApiError(error, "Failed to upload property image");
  }
};

const deletePropertyAsset = async (id) => {
  try {
    return await apiClient.delete(`${API.PROPERTIES}/asset/${id}`);
  } catch (error) {
    return normalizeApiError(error, "Failed to delete property asset");
  }
};

const createProperty = async (payload) => {
  try {
    return await apiClient.post(`${API.PROPERTIES}/create`, payload);
  } catch (error) {
    return normalizeApiError(error, "Failed to create property");
  }
};

const updateProperty = async (id, payload) => {
  try {
    return await apiClient.put(`${API.PROPERTIES}/update/${id}`, payload);
  } catch (error) {
    return normalizeApiError(error, "Failed to update property");
  }
};

const deleteProperty = async (id) => {
  try {
    return await apiClient.delete(`${API.PROPERTIES}/delete/${id}`);
  } catch (error) {
    return normalizeApiError(error, "Failed to delete property");
  }
};

const getPropertiesPublic = async (page = 1, limit = 50, filters = {}) => {
  try {
    return await apiClient.get(`${API.GLOBAL}/properties/all`, {
      params: { page, limit, ...filters },
    });
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch public properties");
  }
};

const PROPERTIES = {
  GET: getProperties,
  GET_PUBLIC: getPropertiesPublic,
  CREATE: createProperty,
  UPDATE: updateProperty,
  DELETE: deleteProperty,
  UPLOAD_IMAGE: uploadPropertyImage,
  DELETE_ASSET: deletePropertyAsset,
};

export default PROPERTIES;
