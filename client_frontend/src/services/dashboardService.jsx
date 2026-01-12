import api from "../api/api";

export const fetchDashboardData = async () => {
  const response = await api.get("/api/sheets/dashboard/");
  // Backend returns {"data": {...}}, so return the nested data object
  return { data: response.data.data || response.data };
};
