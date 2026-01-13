import api from "../api/api";

/**
 * Send a message to the chatbot API
 * @param {string} message - The user's message
 * @returns {Promise<Object>} Response from the chatbot API
 */
export const sendChatbotMessage = async (message) => {
  try {
    const response = await api.post("/api/sheets/chatbot/", {
      message: message,
    });
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Chatbot API error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
    }
    throw error;
  }
};

