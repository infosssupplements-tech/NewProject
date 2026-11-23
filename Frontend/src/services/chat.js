// Uses the backend chat-session API through the load balancer.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const CHAT_SESSIONS_URL = `${API_BASE_URL}/api/chat/sessions`;
let chatSessionId = null;

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  return token ? { Authorization: ["Bearer", token].join(" ") } : {};
};

const createChatSession = async (signal) => {
  const response = await fetch(CHAT_SESSIONS_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ title: "Upolabdhi chat", document_ids: [] }),
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || data?.message || "Unable to create chat session.");
  return data?.chat_id ?? data?.session?.chat_id ?? data?.id;
};

export async function streamChat(messages, { onToken, signal }) {
  const latestMessage = messages.at(-1);
  const question = String(latestMessage?.content || "").trim();
  if (!question) throw new Error("A user message is required.");

  if (!chatSessionId) chatSessionId = await createChatSession(signal);
  if (!chatSessionId) throw new Error("The chat session did not return an ID.");

  const sendQuestion = async () => fetch(
    `${CHAT_SESSIONS_URL}/${encodeURIComponent(chatSessionId)}/messages`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ question, document_ids: [] }),
      signal,
    },
  );

  let response = await sendQuestion();
  if ([502, 503].includes(response.status)) {
    await new Promise((resolve) => setTimeout(resolve, 1800));
    response = await sendQuestion();
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if ([502, 503].includes(response.status)) {
      throw new Error("The AI service is temporarily busy. Please wait a moment and try again.");
    }
    throw new Error(data?.detail || data?.message || "The assistant is unavailable right now.");
  }

  const answer = String(data?.answer || "").trim();
  if (!answer) throw new Error("The assistant returned an empty response.");
  onToken(answer);
  return answer;
}
