import { get, post } from "./client";

export const fetchTables = (status) =>
  get(status ? `/staff/tables?status=${status}` : "/staff/tables");

export const getTableById = (tableId) =>
  get(`/staff/tables/${tableId}`);

export const assignTable = (tableId, body = {}) =>
  post(`/staff/tables/${tableId}/assign`, body);

export const freeTable = (tableId,body) =>
  post(`/staff/tables/${tableId}/free`,body, {});

export const regenerateTableCode = (tableId) =>
  post(`/staff/tables/${tableId}/code/regenerate`, {});

export const createTable = (body) =>
  post("/staff/tables", body);

export const reserveTable = (tableId, body) =>
  post(`/staff/tables/${tableId}/reserve`, body);

