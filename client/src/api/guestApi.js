import { get, post, patch } from "./client";

// Tables
export const fetchActiveTab = (token, config) =>
  get(`/tables/${token}/active-tab`, config);

// Tabs
export const openTab = (tableToken) => post(`/tabs/open`, { tableToken });

export const addItemToTab = (tabId, menuItemId, qty = 1) =>
  patch(`/tabs/${tabId}/items`, { action: "ADD", menuItemId, qty });

export const updateTabItemQty = (tabId, menuItemId, qty) =>
  patch(`/tabs/${tabId}/items`, { action: "UPDATE", menuItemId, qty });

export const removeTabItem = (tabId, menuItemId) =>
  patch(`/tabs/${tabId}/items`, { action: "REMOVE", menuItemId });

export const setTipPercent = (tabId, value) =>
  patch(`/tabs/${tabId}/tip`, { type: "PERCENT", value });

export const setTipAmountCents = (tabId, value) =>
  patch(`/tabs/${tabId}/tip`, { type: "AMOUNT", value });
