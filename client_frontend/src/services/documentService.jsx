import api from "../api/api";

export const fetchDocuments = async () => {
  const response = await api.get("/api/sheets/documents/");
  return response.data;
};
