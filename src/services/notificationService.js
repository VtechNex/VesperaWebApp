import API from "../utils/utils";
import apiClient, { normalizeApiError } from "./apiClient";

function buildNotificationQuery(params = {}) {
  const query = new URLSearchParams();
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");

  for (const [key, value] of entries) {
    query.set(key, String(value));
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function fetchNotifications(params = {}) {
  try {
    const response = await apiClient.get(`${API.NOTIFICATIONS}${buildNotificationQuery(params)}`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch notifications");
  }
}

async function fetchUnreadCount() {
  try {
    const response = await apiClient.get(`${API.NOTIFICATIONS}/unread-count`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch unread count");
  }
}

async function markNotificationRead(id) {
  try {
    const response = await apiClient.patch(`${API.NOTIFICATIONS}/${id}/read`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to mark notification as read");
  }
}

async function markAllNotificationsRead() {
  try {
    const response = await apiClient.patch(`${API.NOTIFICATIONS}/read-all`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to mark all notifications as read");
  }
}

async function deleteNotification(id) {
  try {
    const response = await apiClient.delete(`${API.NOTIFICATIONS}/${id}`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to clear notification");
  }
}

async function clearAllNotifications() {
  try {
    const response = await apiClient.delete(`${API.NOTIFICATIONS}/clear-all`);
    return { status: response.status, data: response.data };
  } catch (error) {
    return normalizeApiError(error, "Failed to clear notifications");
  }
}

const NOTIFICATIONS = {
  FETCH: fetchNotifications,
  FETCH_UNREAD_COUNT: fetchUnreadCount,
  MARK_READ: markNotificationRead,
  MARK_ALL_READ: markAllNotificationsRead,
  DELETE: deleteNotification,
  CLEAR_ALL: clearAllNotifications,
};

export default NOTIFICATIONS;
