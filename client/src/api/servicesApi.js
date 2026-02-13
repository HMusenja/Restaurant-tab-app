
// src/api/servicesApi.js
import { post, get, patch } from "./client";

/**
 * Create a service request (BILL / WATER / HELP / OTHER)
 * Backend should return: { request }
 */
export function createServiceRequest({ tableId, tabId, type, note }) {
  return post("/services", { tableId, tabId, type, note });
}

/**
 * Staff: list service requests
 * Example: fetchServiceRequests({ status: "OPEN" })
 * Backend returns: { requests: [...] }
 */
export function fetchServiceRequests(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return get(`/services${qs ? `?${qs}` : ""}`);
}

/**
 * Staff: update request status
 * Backend returns: { request }
 */
export function updateServiceRequest(id, body) {
  return patch(`/services/${id}`, body);
}


