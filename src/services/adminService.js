import API from "../utils/utils";
import apiClient, { normalizeApiError } from "./apiClient";

async function createUser(user) {
  try {
    return await apiClient.post(`${API.ADMIN}/users`, user);
  } catch (error) {
    return normalizeApiError(error, "Failed to create user");
  }
}

async function fetchUsers() {
  try {
    return await apiClient.get(`${API.ADMIN}/users`);
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch users");
  }
}

async function deleteUser(userId) {
  try {
    return await apiClient.delete(`${API.ADMIN}/users/${userId}`);
  } catch (error) {
    return normalizeApiError(error, "Failed to delete user");
  }
}

async function updateUser(userId, userData) {
  try {
    return await apiClient.put(`${API.ADMIN}/users/${userId}`, userData);
  } catch (error) {
    return normalizeApiError(error, "Failed to update user");
  }
}

async function deactiveUser(userId) {
  try {
    return await apiClient.put(`${API.ADMIN}/users/deactive/${userId}`, {});
  } catch (error) {
    return normalizeApiError(error, "Failed to deactivate user");
  }
}

const ADMIN = {
  CREATE_USER: createUser,
  FETCH_USERS: fetchUsers,
  DELETE_USER: deleteUser,
  UPDATE_USER: updateUser,
  DEACTIVE_USER: deactiveUser,
};

export default ADMIN;
