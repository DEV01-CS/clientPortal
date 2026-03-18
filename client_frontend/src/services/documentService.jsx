import api from "../api/api";

export const fetchDocuments = async () => {
  const response = await api.get("/api/sheets/documents/");
  return response.data;
};

export const uploadDocument = async (file, name, description, type) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  if (description) {
    formData.append("description", description);
  }
  if (type) {
    formData.append("type", type);
  }

  const response = await api.post("/api/sheets/documents/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
