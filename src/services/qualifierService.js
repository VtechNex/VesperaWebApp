import axios from 'axios'
import API from '../utils/utils'
import AUTH from './authService';

async function createQualifier(qualifierData) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(`${API.QUALIFIERS}`, qualifierData, config);
    return response;
  } catch (err) {
    console.error("Error while creating qualifier:", err);
    return err.response;
  }
}

async function fetchQualifiers(type) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = { headers: { Authorization: `Bearer ${token}` }, params: {} };
    if (type) config.params.type = type;
    const response = await axios.get(`${API.QUALIFIERS}`, config);
    return response;
  } catch (err) {
    console.error("Error while fetching qualifiers:", err);
    return err.response;
  }
}

async function getQualifierById(id) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(`${API.QUALIFIERS}/${id}`, config);
    return response;
  } catch (err) {
    console.error("Error while fetching qualifier:", err);
    return err.response;
  }
}

async function updateQualifier(id, data) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(`${API.QUALIFIERS}/${id}`, data, config);
    return response;
  } catch (err) {
    console.error("Error while updating qualifier:", err);
    return err.response;
  }
}

async function deleteQualifier(id) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.delete(`${API.QUALIFIERS}/${id}`, config);
    return response;
  } catch (err) {
    console.error("Error while deleting qualifier:", err);
    return err.response;
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
