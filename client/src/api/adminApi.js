import { get, patch,post } from "./client";

export const getAllUsers = () => get("/admin/users");
export const toggleUserStatus = (id) =>
  patch(`/admin/users/${id}/status`);

export const createUser = (payload) =>
  post("/users/register", payload);

export const updateUser = (id, payload) =>
  patch(`/admin/users/${id}`, payload);

export const resetUserPassword = (id) =>
  patch(`/admin/users/${id}/reset-password`);

export const softDeleteUser = (id) =>
  patch(`/admin/users/${id}/delete`);

export const restoreUser = (id) =>
  patch(`/admin/users/${id}/restore`);

