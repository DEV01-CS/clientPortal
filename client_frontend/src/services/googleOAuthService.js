import api from "../api/api";

export const initiateGoogleOAuth = async () => {
  try {
    const response = await api.get("/api/sheets/oauth/initiate/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkGoogleOAuthStatus = async () => {
  try {
    const response = await api.get("/api/sheets/oauth/status/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

