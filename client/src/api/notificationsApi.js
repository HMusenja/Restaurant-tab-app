import { get, patch } from "./client";

// Inbox
export function fetchNotifications({ unreadOnly, limit, cursor } = {}) {
  const qs = new URLSearchParams();

  if (unreadOnly != null) qs.set("unreadOnly", String(!!unreadOnly));
  if (limit != null) qs.set("limit", String(limit));
  if (cursor) qs.set("cursor", cursor);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return get(`/notifications${suffix}`);
}

// Read
export function markNotificationRead(id) {
  return patch(`/notifications/${id}/read`, {});
}

export function markAllNotificationsRead() {
  return patch(`/notifications/read-all`, {});
}

// Clear (soft delete)
export function clearReadNotifications() {
  return patch(`/notifications/clear-read`, {});
}

export function clearAllNotifications() {
  return patch(`/notifications/clear-all`, {});
}

// Preferences
export function fetchNotificationPreferences() {
  return get(`/me/notification-preferences`);
}

export function patchNotificationPreferences(patchBody) {
  return patch(`/me/notification-preferences`, patchBody || {});
}