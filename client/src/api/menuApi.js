import { get, post, patch, del } from "./client";

// Guest: only available items
export const fetchMenu = () => get("/menu");

// Admin: all items (available + unavailable)
export const fetchMenuAdmin = () => get("/menu?all=true");

// CRUD (admin)
export const createMenuItem = (payload) => post("/menu", payload);
export const updateMenuItem = (id, payload) => patch(`/menu/${id}`, payload);
export const deleteMenuItem = (id) => del(`/menu/${id}`);
export const fetchMenuItemById = (id) => get(`/menu/${id}`);
