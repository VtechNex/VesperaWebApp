import axios from "axios";
import API from "../utils/utils";
import AUTH from "../services/authService"; // ⚠️ adjust correct path

/* =========================
   Helper: Get Auth Header
========================= */

const getAuthHeader = () => {
    const token = AUTH.GET_TOKEN();

    if (!token) {
        console.error("No valid auth token found");
        return {};
    }

    return {
        Authorization: `Bearer ${token}`
    };
};

/* =========================
   GET PROPERTIES (Admin)
========================= */

const getProperties = async (page = 1, limit = 20, filters = {}) => {
    try {
        const response = await axios.get(
            `${API.PROPERTIES}/all?page=${page}&limit=${limit}`,
            {
                headers: getAuthHeader(),
                params: filters
            }
        );
        return response;
    } catch (error) {
        console.error("Error fetching properties:", error);
        return error.response;
    }
};

/* =========================
   UPLOAD PROPERTY IMAGE
========================= */

const uploadPropertyImage = async (formData) => {
    try {
        const response = await axios.post(
            `${API.PROPERTIES}/upload-property-images`,
            formData,
            {
                headers: {
                    ...getAuthHeader(),
                    "Content-Type": "multipart/form-data"
                }
            }
        );
        return response;
    } catch (error) {
        console.error("Error uploading property image:", error);
        return { status: 500 };
    }
};

/* =========================
   DELETE PROPERTY ASSET
========================= */

const deletePropertyAsset = async (id) => {
    try {
        const response = await axios.delete(
            `${API.PROPERTIES}/asset/${id}`,
            {
                headers: getAuthHeader()
            }
        );
        return response;
    } catch (error) {
        console.error("Error deleting property asset:", error);
        return error.response;
    }
};

/* =========================
   CREATE PROPERTY
========================= */

const createProperty = async (payload) => {
    try {
        const response = await axios.post(
            `${API.PROPERTIES}/create`,
            payload,
            {
                headers: {
                    ...getAuthHeader(),
                    "Content-Type": "application/json"
                }
            }
        );
        return response;
    } catch (error) {
        console.error("Error creating property:", error);
        return error.response;
    }
};

/* =========================
   UPDATE PROPERTY
========================= */

const updateProperty = async (id, payload) => {
    try {
        const response = await axios.put(
            `${API.PROPERTIES}/update/${id}`,
            payload,
            {
                headers: {
                    ...getAuthHeader(),
                    "Content-Type": "application/json"
                }
            }
        );
        return response;
    } catch (error) {
        console.error("Error updating property:", error);
        return error.response;
    }
};

/* =========================
   DELETE PROPERTY
========================= */

const deleteProperty = async (id) => {
    try {
        const response = await axios.delete(
            `${API.PROPERTIES}/delete/${id}`,
            {
                headers: getAuthHeader()
            }
        );
        return response;
    } catch (error) {
        console.error("Error deleting property:", error);
        return error.response;
    }
};

/* =========================
   PUBLIC FETCH (No Auth)
========================= */

const getPropertiesPublic = async (page = 1, limit = 50) => {
    try {
        const response = await axios.get(
            `${API.GLOBAL}/properties/all?page=${page}&limit=${limit}`
        );
        return response;
    } catch (error) {
        console.error("Error fetching public properties:", error);
        return error.response;
    }
};

/* =========================
   EXPORT
========================= */

const PROPERTIES = {
    GET: getProperties,
    GET_PUBLIC: getPropertiesPublic,
    CREATE: createProperty,
    UPDATE: updateProperty,
    DELETE: deleteProperty,
    UPLOAD_IMAGE: uploadPropertyImage,
    DELETE_ASSET: deletePropertyAsset
};

export default PROPERTIES;