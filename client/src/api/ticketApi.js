import { post } from "./client";

export const createTicket = (tabId) =>
  post(`/tabs/${tabId}/tickets`);
