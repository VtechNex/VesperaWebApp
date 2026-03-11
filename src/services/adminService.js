import axios from 'axios'
import API from '../utils/utils'
import AUTH from './authService';

async function createUser(user) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${API.ADMIN}/users`, user, config);
    return response;
  } catch (err) {
    console.error("Error while creating user:", err);
    return err.response;
  }
}

async function fetchUsers() {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(`${API.ADMIN}/users`, config);
    return response;
  } catch (err) {
    console.error("Error while fetching users:", err);
    return err.response;
  }
}

async function deleteUser(userId) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.delete(`${API.ADMIN}/users/${userId}`, config);
    return response;
  } catch (err) {
    console.error("Error while deleting user:", err);
    return err.response;
  }
}

async function updateUser(userId, userData) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.put(`${API.ADMIN}/users/${userId}`, userData, config);
    return response;
  } catch (err) {
    console.error("Error while updating user:", err);
    return err.response;
  }
}

async function deactiveUser(userId) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.put(`${API.ADMIN}/users/deactive/${userId}`, {}, config);
    return response;
  } catch (err) {
    console.error("Error while deactivating user:", err);
    return err.response;
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
