import { get } from "./client";

export const fetchTableTickets = (token) => get(`/tables/${token}/tickets`);
