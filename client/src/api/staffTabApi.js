import { get, post } from "./client";

export function getTabForStaff(tabId) {
  return get(`/staff/tabs/${tabId}`); // we'll add this endpoint in Phase 3B
}

export function payTab(tabId, method) {
  return post(`/staff/tabs/${tabId}/pay`, { method }); // from Phase 2
}

export function closeTab(tabId) {
  return post(`/staff/tabs/${tabId}/close`);
}
