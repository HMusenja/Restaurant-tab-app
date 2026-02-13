// src/api/adminFinanceApi.js
import { get } from "./client";

export const fetchAdminFinanceSummary = (params = {}) => {
  const qs = new URLSearchParams();

  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  if (params.groupBy) qs.set("groupBy", params.groupBy);
  if (params.limit) qs.set("limit", String(params.limit));

 
  if (params.toMode) qs.set("toMode", String(params.toMode));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return get(`/admin/finance/summary${suffix}`);
};

