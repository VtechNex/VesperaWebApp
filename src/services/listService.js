import axios from 'axios'
import API from '../utils/utils'
import AUTH from './authService';

async function createList(listData) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${API.LISTS}`, listData, config);
    return response;
  } catch (err) {
    console.error("Error while creating list:", err);
    return err.response;
  }
}

async function fetchLists() {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(`${API.LISTS}`, config);
    return response;
  } catch (err) {
    console.error("Error while fetching lists:", err);
    return err.response;
  }
}

async function fetchListsWithCounts() {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(`${API.LISTS}/with-counts`, config);
    return response;
  } catch (err) {
    console.error("Error while fetching lists with counts:", err);
    return err.response;
  }
}

async function getListById(listId) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(`${API.LISTS}/${listId}`, config);
    return response;
  } catch (err) {
    console.error("Error while fetching list:", err);
    return err.response;
  }
}

async function updateList(listId, listData) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.put(`${API.LISTS}/${listId}`, listData, config);
    return response;
  } catch (err) {
    console.error("Error while updating list:", err);
    return err.response;
  }
}

async function deleteList(listId) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.delete(`${API.LISTS}/${listId}`, config);
    return response;
  } catch (err) {
    console.error("Error while deleting list:", err);
    return err.response;
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
