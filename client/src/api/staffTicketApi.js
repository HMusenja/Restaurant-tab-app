import { get, patch } from "./client";


export const fetchTickets = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/staff/tickets${qs ? `?${qs}` : ""}`);
};

export const updateTicket = (ticketId, payload) =>
  patch(`/staff/tickets/${ticketId}`, payload);

export const updateTicketLine = (ticketId, lineId, payload) =>
  patch(`/staff/tickets/${ticketId}/lines/${lineId}`, payload);
