import { apiRequest } from "./api.js";

export const WORKSPACE_CHAT_SESSIONS_CACHE_KEY = "workspace-chat-sessions";

export const listChatSessions = (page = 1, limit = 20) => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiRequest(`/api/chat/sessions?${query.toString()}`);
};

export const createChatSession = async (title = "New conversation", documentIds = []) => {
  let response;
  try {
    response = await apiRequest("/api/chat/sessions", {
      method: "POST",
      body: { title, document_ids: documentIds },
    });
  } catch (error) {
    if (error?.status !== 404) throw error;
    response = await apiRequest("/api/chat/sessions/", {
      method: "POST",
      body: { title, document_ids: documentIds },
    });
  }
  const session = response?.session
    ?? response?.chat
    ?? response?.data?.session
    ?? response?.data?.chat
    ?? response?.data
    ?? response;
  const chatId = session?.chat_id ?? session?.session_id ?? session?.id ?? session?._id;
  if (!chatId || String(chatId) === "undefined" || String(chatId) === "null") {
    throw new Error("The chat session response did not contain a chat_id.");
  }
  return {
    ...session,
    chat_id: String(chatId),
  };
};

export const getChatMessages = (sessionId) =>
  apiRequest(`/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`);

export const getChatSession = async (sessionId) => {
  const response = await apiRequest(`/api/chat/sessions/${encodeURIComponent(sessionId)}`);
  return response?.session
    ?? response?.chat
    ?? response?.data?.session
    ?? response?.data?.chat
    ?? response?.data
    ?? response;
};

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const getChatErrorMessage = (error) => {
  const message = String(error?.message || "");
  const providerUnavailable = error?.status === 502
    || error?.status === 503
    || /502|503|unavailable|high demand/i.test(message);

  if (providerUnavailable) {
    return "The AI service is temporarily busy. Please wait a moment and try again.";
  }
  return message || "Unable to answer your question.";
};

export const askChatQuestion = async (sessionId, question, documentIds = [], retries = 3) => {
  try {
    return await apiRequest(`/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`, {
      method: "POST",
      body: { question, document_ids: documentIds },
    });
  } catch (error) {
    if (retries > 0 && [502, 503].includes(error?.status)) {
      await wait(1800 * (4 - retries));
      return askChatQuestion(sessionId, question, documentIds, retries - 1);
    }

    const friendlyError = new Error(getChatErrorMessage(error));
    friendlyError.status = error?.status;
    throw friendlyError;
  }
};

export const deleteChatSession = (sessionId) =>
  apiRequest(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
