import api from "../api/api";

// Test Google Sheets OAuth connection (requires authentication and OAuth setup)
export const testGoogleSheetsConnection = async () => {
  try {
    const response = await api.get("/api/sheets/test-sheets/");
    return response.data;
  } catch (error) {
    // Preserve the original error with response data
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        "Failed to connect to Google Sheets. Please ensure your Google account is connected via OAuth.";
    
    const customError = new Error(errorMessage);
    customError.response = error.response; // Preserve response for better error handling
    throw customError;
  }
};

// Test Google Drive OAuth connection (requires authentication and OAuth setup)
export const testGoogleDriveConnection = async () => {
  try {
    const response = await api.get("/api/sheets/test-drive/");
    return response.data;
  } catch (error) {
    // Preserve the original error with response data
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        "Failed to connect to Google Drive. Please ensure your Google account is connected via OAuth.";
    
    const customError = new Error(errorMessage);
    customError.response = error.response; // Preserve response for better error handling
    throw customError;
  }
};

// Get client documents from Google Sheets and Drive
// Note: Dashboard data fetching moved to dashboardService.jsx to avoid duplication
export const getClientDocuments = async () => {
  try {
    const response = await api.get("/api/sheets/documents/");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "Failed to fetch documents"
    );
  }
};

