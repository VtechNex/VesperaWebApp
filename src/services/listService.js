import API from "../utils/utils";
import apiClient, { normalizeApiError } from "./apiClient";

async function createList(listData) {
  try {
    return await apiClient.post(API.LISTS, listData);
  } catch (error) {
    return normalizeApiError(error, "Failed to create list");
  }
}

async function fetchLists() {
  try {
    return await apiClient.get(API.LISTS);
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch lists");
  }
}

async function fetchListsWithCounts() {
  try {
    return await apiClient.get(`${API.LISTS}/with-counts`);
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch lists with counts");
  }
}

async function getListById(listId) {
  try {
    return await apiClient.get(`${API.LISTS}/${listId}`);
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch list");
  }
}

async function updateList(listId, listData) {
  try {
    return await apiClient.put(`${API.LISTS}/${listId}`, listData);
  } catch (error) {
    return normalizeApiError(error, "Failed to update list");
  }
}

async function deleteList(listId) {
  try {
    return await apiClient.delete(`${API.LISTS}/${listId}`);
  } catch (error) {
    return normalizeApiError(error, "Failed to delete list");
  }
}

const LISTS = {
  CREATE: createList,
  FETCH_ALL: fetchLists,
  FETCH_WITH_COUNTS: fetchListsWithCounts,
  GET_BY_ID: getListById,
  UPDATE: updateList,
  DELETE: deleteList,
};

export default LISTS;
