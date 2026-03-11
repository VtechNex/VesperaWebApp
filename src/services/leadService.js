import axios from 'axios'
import API from '../utils/utils'
import AUTH from './authService';

async function createLead(leadData) {
  try {
    console.log("🔵 [LEAD SERVICE] Creating lead with data:", leadData);
    
    // Validate required fields
    if (!leadData.fname || !leadData.mobile || !leadData.list_id) {
      console.error("🔴 [LEAD SERVICE] Missing required fields");
      return {
        status: 400,
        data: { message: "First name, mobile, and list are required" }
      };
    }

    const token = AUTH.GET_TOKEN();
    console.log("🔵 [LEAD SERVICE] Token exists?", !!token);
    
    if (!token) {
      console.error("🔴 [LEAD SERVICE] No token found");
      return {
        status: 401,
        data: { message: "Please login to continue" }
      };
    }

    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log("🔵 [LEAD SERVICE] Calling API:", API.LEADS);
    
    const response = await axios.post(API.LEADS, leadData, config);
    
    console.log("✅ [LEAD SERVICE] Lead created successfully!");
    console.log("✅ [LEAD SERVICE] Response:", response.data);
    
    return {
      status: response.status,
      data: response.data
    };
    
  } catch (err) {
    console.error("🔴 [LEAD SERVICE ERROR] Failed to create lead:", err);
    console.error("🔴 Error details:", err.response?.data);
    
    // Return a consistent error structure
    return {
      status: err.response?.status || 500,
      data: {
        message: err.response?.data?.message || err.message || "Failed to create lead",
        error: err.message
      }
    };
  }
}

async function fetchAllLeads() {
  try {
    console.log("🔵 [LEAD SERVICE] Fetching all leads...");
    
    const token = AUTH.GET_TOKEN();
    
    if (!token) {
      console.error("🔴 [LEAD SERVICE] No token found");
      return {
        status: 401,
        data: { message: "Please login to continue" }
      };
    }

    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log("🔵 [LEAD SERVICE] Calling API:", API.LEADS);
    
    const response = await axios.get(API.LEADS, config);
    
    console.log("✅ [LEAD SERVICE] Leads fetched successfully!");
    console.log("✅ [LEAD SERVICE] Full response:", response.data);
    
    // Your backend returns: { success: true, data: [...] }
    const leadsData = response.data.data || [];
    
    console.log(`✅ [LEAD SERVICE] Found ${leadsData.length} leads`);
    
    return {
      status: response.status,
      data: response.data
    };
    
  } catch (err) {
    console.error("🔴 [LEAD SERVICE ERROR] Failed to fetch leads:", err);
    console.error("🔴 Error response:", err.response?.data);
    
    return {
      status: err.response?.status || 500,
      data: {
        message: err.response?.data?.message || err.message || "Failed to fetch leads",
        error: err.message,
        data: []
      }
    };
  }
}

async function deleteLead(leadId) {
  try {
    console.log("🔵 [LEAD SERVICE] Deleting lead ID:", leadId);
    
    const token = AUTH.GET_TOKEN();
    
    if (!token) {
      return {
        status: 401,
        data: { message: "Please login to continue" }
      };
    }

    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.delete(`${API.LEADS}/${leadId}`, config);
    
    console.log("✅ [LEAD SERVICE] Lead deleted successfully!");
    
    return {
      status: response.status,
      data: response.data
    };
    
  } catch (err) {
    console.error("🔴 [LEAD SERVICE ERROR] Failed to delete lead:", err);
    
    return {
      status: err.response?.status || 500,
      data: {
        message: err.response?.data?.message || err.message || "Failed to delete lead",
        error: err.message
      }
    };
  }
}

// Keep other functions as they are
async function fetchLeadsByListId(listId) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(`${API.LEADS}/list/${listId}`, config);
    return {
      status: response.status,
      data: response.data
    };
  } catch (err) {
    console.error("Error while fetching leads by list:", err);
    return {
      status: err.response?.status || 500,
      data: err.response?.data || { message: "Failed to fetch leads by list" }
    };
  }
}

async function getLeadById(leadId) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(`${API.LEADS}/${leadId}`, config);
    return {
      status: response.status,
      data: response.data
    };
  } catch (err) {
    console.error("Error while fetching lead:", err);
    return {
      status: err.response?.status || 500,
      data: err.response?.data || { message: "Failed to fetch lead" }
    };
  }
}

async function updateLead(leadId, leadData) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.put(`${API.LEADS}/${leadId}`, leadData, config);
    return {
      status: response.status,
      data: response.data
    };
  } catch (err) {
    console.error("Error while updating lead:", err);
    return {
      status: err.response?.status || 500,
      data: err.response?.data || { message: "Failed to update lead" }
    };
  }
}

async function searchLeads(query) {
  try {
    const token = AUTH.GET_TOKEN();
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${API.LEADS}/search`, { query }, config);
    return {
      status: response.status,
      data: response.data
    };
  } catch (err) {
    console.error("Error while searching leads:", err);
    return {
      status: err.response?.status || 500,
      data: err.response?.data || { message: "Failed to search leads" }
    };
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
};

export default LEADS;