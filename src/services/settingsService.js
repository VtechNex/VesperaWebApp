import API from "../utils/utils";
import apiClient from "./apiClient";

async function getProfile() {
  return apiClient.get(`${API.AUTH}/me`);
}

async function updateProfile(payload) {
  return apiClient.put(`${API.AUTH}/me`, payload);
}

async function changePassword(payload) {
  return apiClient.put(`${API.AUTH}/change-password`, payload);
}

async function getCompanyProfile() {
  return apiClient.get(`${API.SETTINGS}/company-profile`);
}

async function saveCompanyProfile(payload) {
  return apiClient.put(`${API.SETTINGS}/company-profile`, payload);
}

async function uploadBranding(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post(`${API.SETTINGS}/branding/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

async function getCustomFields() {
  return apiClient.get(`${API.SETTINGS}/custom-fields`);
}

async function createCustomField(payload) {
  return apiClient.post(`${API.SETTINGS}/custom-fields`, payload);
}

async function updateCustomField(id, payload) {
  return apiClient.put(`${API.SETTINGS}/custom-fields/${id}`, payload);
}

async function deleteCustomField(id) {
  return apiClient.delete(`${API.SETTINGS}/custom-fields/${id}`);
}

const SETTINGS = {
  GET_PROFILE: getProfile,
  UPDATE_PROFILE: updateProfile,
  CHANGE_PASSWORD: changePassword,
  GET_COMPANY_PROFILE: getCompanyProfile,
  SAVE_COMPANY_PROFILE: saveCompanyProfile,
  UPLOAD_BRANDING: uploadBranding,
  GET_CUSTOM_FIELDS: getCustomFields,
  CREATE_CUSTOM_FIELD: createCustomField,
  UPDATE_CUSTOM_FIELD: updateCustomField,
  DELETE_CUSTOM_FIELD: deleteCustomField,
};

export default SETTINGS;
