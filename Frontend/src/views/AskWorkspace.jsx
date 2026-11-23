import { useEffect, useRef, useState } from "react";
import useSWR, { mutate as mutateSWR } from "swr";
import {
  listWorkspaceDocuments,
  WORKSPACE_DOCUMENTS_CACHE_KEY,
} from "../Actions/DashboardAction.js";
import { FileText, Search, X } from "lucide-react";
import {
  askChatQuestion,
  createChatSession,
  deleteChatSession,
  getChatMessages,
  getChatSession,
  getChatErrorMessage,
  listChatSessions,
  WORKSPACE_CHAT_SESSIONS_CACHE_KEY,
} from "../Actions/ChatAction.js";
import { ChatHistoryPanel, ConversationPanel, SourcesPanel } from "../components/dashboard/AskWorkspacePanels.jsx";

const getSessionId = (session) => {
  const value = session.chat_id ?? session.session_id ?? session.id ?? session._id;
  return value == null || value === "" ? null : String(value);
};
const getDocumentId = (document) => document.id ?? document.document_id ?? document._id;
const getSessionTitle = (session) => session?.title
  ?? session?.chat_title
  ?? session?.session_title
  ?? session?.name
  ?? session?.chat_name;

const deriveChatTitle = (question) => {
  const words = String(question || "")
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "New Conversation";

  const stopWords = new Set([
    "a", "an", "and", "are", "about", "can", "could", "do", "explain",
    "give", "how", "i", "is", "it", "me", "of", "please", "summarize",
    "tell", "the", "this", "to", "what", "why", "you",
  ]);
  const meaningful = words.filter((word) => !stopWords.has(word.toLowerCase()));
  const titleWords = (meaningful.length ? meaningful : words).slice(0, 5);

  return titleWords
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const isPlaceholderChatTitle = (title) => !title
  || ["new chat", "new conversation", "untitled conversation"].includes(String(title).trim().toLowerCase())
  || /^chat about /i.test(String(title).trim());

const getRows = (response, key) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizeChatMessage = (message) => ({
  role: String(message.role ?? message.sender ?? message.message_type ?? "assistant").toLowerCase(),
  text: message.content ?? message.text ?? message.answer ?? message.question ?? "",
  citations: Array.isArray(message.citations)
    ? message.citations
    : Array.isArray(message.sources)
      ? message.sources
      : [],
  createdAt: message.created_at ?? message.timestamp ?? message.createdAt ?? null,
});

const withSessions = (currentData, update) => {
  const sessions = getRows(currentData, "sessions");
  return { ...(currentData && !Array.isArray(currentData) ? currentData : {}), sessions: update(sessions) };
};

export default function AskWorkspace({ initialDocumentId = null, initialChatId = null }) {
  const [activeChat, setActiveChat] = useState(null);
  const [context, setContext] = useState([]);
  const [question, setQuestion] = useState("");
  const [actionError, setActionError] = useState("");
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [sourceCitations, setSourceCitations] = useState(null);
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false);
  const [documentPickerQuery, setDocumentPickerQuery] = useState("");
  const messagesEnd = useRef(null);
  const appliedInitialChatId = useRef(null);
  const appliedInitialDocumentId = useRef(null);

  const {
    data: chatData,
    error: chatError,
    mutate: mutateSessions,
  } = useSWR(
    WORKSPACE_CHAT_SESSIONS_CACHE_KEY,
    () => listChatSessions(1, 100),
    { revalidateOnFocus: true },
  );
  const {
    data: documentData,
    error: documentError,
  } = useSWR(
    WORKSPACE_DOCUMENTS_CACHE_KEY,
    () => listWorkspaceDocuments({ page: 1, limit: 100 }),
    {
      refreshInterval: (currentData) => getRows(currentData, "documents").some((document) =>
        ["uploaded", "processing"].includes(String(document.status || "").toLowerCase())
      ) ? 2500 : 0,
    },
  );
  const chats = getRows(chatData, "sessions")
    .map((session) => {
      const sessionId = getSessionId(session);
      const title = getSessionTitle(session);
      return sessionId ? { ...session, title, chat_id: sessionId, id: sessionId } : null;
    })
    .filter(Boolean);
  const documents = getRows(documentData, "documents").map((document) => ({ ...document, id: getDocumentId(document) }));
  const readyDocuments = documents.filter((document) => String(document.status).toLowerCase() === "ready");
  const messagesKey = activeChat ? ["chat-messages", String(activeChat)] : null;
  const {
    data: messageData,
    error: messageError,
  } = useSWR(
    messagesKey,
    async ([, sessionId]) => ({
      sessionId: String(sessionId),
      response: await getChatMessages(sessionId),
    }),
  );
  const wrappedMessageData = messageData && "sessionId" in messageData ? messageData : null;
  const persistedMessages = String(wrappedMessageData?.sessionId ?? "") === String(activeChat ?? "")
    ? getRows(wrappedMessageData?.response, "messages").map(normalizeChatMessage)
    : [];
  const visiblePendingMessages = pendingMessage && (
    (pendingMessage.sessionId === "__new__" && !activeChat)
    || String(pendingMessage.sessionId) === String(activeChat)
  )
    ? [pendingMessage.user, pendingMessage.assistant].filter(Boolean)
    : [];
  const optimisticMessages = visiblePendingMessages.filter((pending) =>
    !persistedMessages.some((saved) =>
      saved.role === pending.role && saved.text === pending.text
    )
  );
  const messages = [...persistedMessages, ...optimisticMessages];
  const latestCitations = [...messages].reverse().find((message) => message.role === "assistant")?.citations || [];
  const displayedCitations = sourceCitations ?? latestCitations;
  const selectedContextDocuments = context
    .map((id) => documents.find((document) => String(getDocumentId(document)) === String(id)))
    .filter(Boolean);
  const messageLoadError = messageError?.status === 404
    ? ""
    : messageError?.message;
  const error = actionError || messageLoadError || chatError?.message || documentError?.message || "";

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending]);

  useEffect(() => {
    if (!initialDocumentId) return;
    setContext([initialDocumentId]);
  }, [initialDocumentId]);

  useEffect(() => {
    if (!initialDocumentId || initialChatId != null) return undefined;
    const documentId = String(initialDocumentId);
    if (appliedInitialDocumentId.current === documentId) return undefined;
    appliedInitialDocumentId.current = documentId;

    let cancelled = false;
    const startDocumentChat = async () => {
      try {
        setActionError("");
        setCreatingChat(true);
        const document = documents.find((item) => String(getDocumentId(item)) === documentId);
        const title = document?.title || document?.name || document?.filename || "Document";
        const session = await createChatSession(`Chat about ${title}`, [documentId]);
        const sessionId = String(getSessionId(session) ?? "");
        if (!sessionId) throw new Error("The chat session could not be created.");
        if (cancelled) return;

        await mutateSWR(
          ["chat-messages", sessionId],
          { sessionId, response: { messages: [], total: 0 } },
          { revalidate: false },
        );
        await updateSessionCache(session, sessionId);
        setActiveChat(sessionId);
        setContext([documentId]);
        setPendingMessage(null);
        setSourceCitations(null);
        setActiveSourceIndex(0);
        setQuestion("");
      } catch (requestError) {
        if (!cancelled) setActionError(requestError.message || "Unable to create the document chat.");
      } finally {
        if (!cancelled) setCreatingChat(false);
      }
    };

    void startDocumentChat();
    return () => {
      cancelled = true;
      if (appliedInitialDocumentId.current === documentId) {
        appliedInitialDocumentId.current = null;
      }
    };
  }, [initialChatId, initialDocumentId]);

  useEffect(() => {
    if (!chats.length) return;
    if (initialDocumentId && initialChatId == null) return;
    const requestedSession = initialChatId == null
      ? null
      : chats.find((session) => String(getSessionId(session)) === String(initialChatId));
    if (requestedSession && appliedInitialChatId.current !== String(initialChatId)) {
      const sessionId = String(getSessionId(requestedSession));
      appliedInitialChatId.current = sessionId;
      setActiveChat(sessionId);
      if (!initialDocumentId) setContext(Array.isArray(requestedSession.document_ids) ? requestedSession.document_ids : []);
      return;
    }
    if (initialChatId == null) appliedInitialChatId.current = null;
    if (!activeChat) {
      const firstSession = requestedSession || chats[0];
      setActiveChat(String(getSessionId(firstSession)));
      if (!initialDocumentId) setContext(Array.isArray(firstSession.document_ids) ? firstSession.document_ids : []);
    }
  }, [activeChat, chats, initialChatId, initialDocumentId]);

  useEffect(() => {
    if (messageError?.status !== 404 || !activeChat) return;
    setActionError("");
  }, [messageError, activeChat]);

  const updateSessionCache = async (session, sessionId) => {
    await mutateSessions((current) => withSessions(current, (sessions) => [
      {
        ...(sessions.find((item) => String(getSessionId(item)) === String(sessionId)) || {}),
        ...session,
        title: getSessionTitle(session) || sessions.find((item) => String(getSessionId(item)) === String(sessionId))?.title,
        chat_id: sessionId,
        id: sessionId,
      },
      ...sessions.filter((item) => String(getSessionId(item)) !== String(sessionId)),
    ]), { revalidate: false });
  };

  const refreshSessionTitle = async (sessionId) => {
    let latestSession = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      latestSession = await getChatSession(sessionId);
      const title = getSessionTitle(latestSession);
      if (title && !isPlaceholderChatTitle(title)) {
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
    if (latestSession && !isPlaceholderChatTitle(getSessionTitle(latestSession))) {
      await updateSessionCache(latestSession, sessionId);
    }
  };

  const removeSessionCache = async (sessionId) => {
    await mutateSessions((current) => withSessions(current, (sessions) =>
      sessions.filter((item) => String(getSessionId(item)) !== String(sessionId))
    ), { revalidate: false });
  };

  const sendMessage = async (event, messageOverride) => {
    event?.preventDefault?.();
    const value = (messageOverride ?? question).trim();
    if (!value || sending) return;

    const userMessage = { role: "user", text: value, createdAt: new Date().toISOString() };
    let sessionId = activeChat;
    const fallbackTitle = deriveChatTitle(value);
    const currentSession = chats.find((chat) => String(getSessionId(chat)) === String(sessionId));
    const shouldRenameFromFirstMessage = currentSession
      && isPlaceholderChatTitle(getSessionTitle(currentSession));
    if (shouldRenameFromFirstMessage) {
      await updateSessionCache({
        ...currentSession,
        title: fallbackTitle,
      }, String(sessionId));
    }
    setPendingMessage({ sessionId: sessionId || "__new__", user: userMessage, assistant: null });
    setQuestion("");

    try {
      setSending(true);
      setActionError("");

      if (!sessionId || sessionId === "undefined" || sessionId === "null") {
        const session = await createChatSession("New conversation", context);
        sessionId = String(getSessionId(session) ?? "");
        if (!sessionId) throw new Error("The chat session could not be created.");
        await updateSessionCache({ ...session, title: fallbackTitle }, sessionId);
        setActiveChat(sessionId);
        setPendingMessage({ sessionId, user: userMessage, assistant: null });
      }
      let response;
      try {
        response = await askChatQuestion(sessionId, value, context);
      } catch (requestError) {
        if (requestError.status !== 404) throw requestError;
        await removeSessionCache(sessionId);
        const session = await createChatSession("New conversation", context);
        sessionId = String(getSessionId(session) ?? "");
        if (!sessionId) throw new Error("The chat session could not be created.");
        await updateSessionCache({ ...session, title: fallbackTitle }, sessionId);
        setActiveChat(sessionId);
        setPendingMessage({ sessionId, user: userMessage, assistant: null });
        response = await askChatQuestion(sessionId, value, context);
      }

      const payload = response?.data ?? response?.result ?? response;
      const responseTitle = getSessionTitle({
        ...(payload?.session ?? payload?.chat ?? payload ?? {}),
        title: payload?.title ?? payload?.chat_title ?? payload?.session_title ?? payload?.name
          ?? payload?.session?.title ?? payload?.chat?.title
      });
      const answer = payload?.answer ?? payload?.content ?? payload?.text ?? payload?.message?.content;
      if (!answer) throw new Error("The assistant returned an empty answer.");
      const responseCitations = payload?.citations ?? payload?.sources ?? payload?.message?.citations;
      const citations = Array.isArray(responseCitations) ? responseCitations : [];
      const assistantMessage = { role: "assistant", text: answer, citations, createdAt: new Date().toISOString() };
      setPendingMessage({ sessionId, user: userMessage, assistant: assistantMessage });
      setActiveSourceIndex(0);
      setSourceCitations(null);

      try {
        const savedMessages = await getChatMessages(sessionId);
        await mutateSWR(
          ["chat-messages", String(sessionId)],
          { sessionId: String(sessionId), response: savedMessages },
          { revalidate: false },
        );
        setPendingMessage(null);
      } catch {
        // Keep the answer visible if the message history endpoint is temporarily unavailable.
      }
      try {
        if (responseTitle && !isPlaceholderChatTitle(responseTitle)) {
          await updateSessionCache({
            title: responseTitle,
            chat_id: sessionId,
          }, sessionId);
        } else {
          await refreshSessionTitle(sessionId);
        }
      } finally {
        await mutateSessions();
      }
    } catch (requestError) {
      setActionError(getChatErrorMessage(requestError));
      setPendingMessage(null);
    } finally {
      setSending(false);
    }
  };

  const newChat = async () => {
    if (creatingChat) return;
    try {
      setActionError("");
      setCreatingChat(true);
      const session = await createChatSession("New conversation", context);
      const sessionId = String(getSessionId(session) ?? "");
      if (!sessionId) throw new Error("The chat session could not be created.");
      await mutateSWR(
        ["chat-messages", sessionId],
        { sessionId, response: { messages: [], total: 0 } },
        { revalidate: false },
      );
      await updateSessionCache(session, sessionId);
      setActiveChat(sessionId);
      setPendingMessage(null);
      setSourceCitations(null);
      setActiveSourceIndex(0);
      setQuestion("");
    } catch (requestError) {
      setActionError(requestError.message || "Unable to create a conversation.");
    } finally {
      setCreatingChat(false);
    }
  };

  const removeChat = async (sessionId) => {
    try {
      setActionError("");
      await deleteChatSession(sessionId);
      await mutateSessions((current) => withSessions(current, (sessions) =>
        sessions.filter((chat) => String(getSessionId(chat)) !== String(sessionId))
      ), { revalidate: false });
      if (String(activeChat) === String(sessionId)) {
        const remainingChats = chats.filter((chat) =>
          String(getSessionId(chat)) !== String(sessionId)
        );
        setActiveChat(remainingChats.length ? String(getSessionId(remainingChats[0])) : null);
        setPendingMessage(null);
        setSourceCitations(null);
        setActiveSourceIndex(0);
      }
    } catch (requestError) {
      setActionError(requestError.message || "Unable to delete this conversation.");
    }
  };

  const selectChat = (chat) => {
    setPendingMessage(null);
    setSourceCitations(null);
    setActiveSourceIndex(0);
    setActionError("");
    setActiveChat(String(getSessionId(chat)));
    setContext(Array.isArray(chat.document_ids) ? chat.document_ids : []);
  };

  const focusDocumentPicker = () => {
    setDocumentPickerOpen(true);
  };

  const visibleReadyDocuments = readyDocuments.filter((document) => {
    const searchable = `${document.title || ""} ${document.filename || ""}`.toLowerCase();
    return searchable.includes(documentPickerQuery.trim().toLowerCase());
  });

  const toggleDocumentContext = (documentId) => {
    const normalizedId = String(documentId);
    setContext((current) =>
      current.some((id) => String(id) === normalizedId)
        ? current.filter((id) => String(id) !== normalizedId)
        : [...current, normalizedId]
    );
  };

  useEffect(() => {
    if (!documentPickerOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setDocumentPickerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [documentPickerOpen]);

  return (
    <main className="workspace-page ask-workspace-page">
      <section className={`workspace-ask-grid ${historyCollapsed ? "history-collapsed" : ""} ${sourcesOpen ? "" : "sources-hidden"}`}>
        <ChatHistoryPanel
          chats={chats}
          activeChat={activeChat}
          collapsed={historyCollapsed}
          onToggleCollapsed={() => setHistoryCollapsed((collapsed) => !collapsed)}
          onNewChat={newChat}
          newChatDisabled={creatingChat}
          onSelectChat={selectChat}
          onRemoveChat={removeChat}
        />
        <ConversationPanel
          title={chats.find((chat) => String(getSessionId(chat)) === String(activeChat))?.title || "New conversation"}
          contextCount={context.length}
          messages={messages}
          citations={latestCitations}
          error={error}
          sending={sending}
          question={question}
          setQuestion={setQuestion}
          onSendMessage={sendMessage}
          onClearContext={() => setContext([])}
          sourcesOpen={sourcesOpen}
          onShowSources={() => setSourcesOpen(true)}
          onAddDocuments={focusDocumentPicker}
          onCitationSelect={(index, citationList) => {
            setActiveSourceIndex(index);
            setSourceCitations(citationList);
            setSourcesOpen(true);
          }}
          messagesEndRef={messagesEnd}
        />
        <aside className="workspace-right-sidebar">
          {sourcesOpen && (
            <SourcesPanel
              citations={displayedCitations}
              documents={documents}
              contextDocuments={selectedContextDocuments}
              activeSourceIndex={activeSourceIndex}
              onSelectSource={setActiveSourceIndex}
              onRemoveDocument={(documentId) => setContext((current) =>
                current.filter((id) => String(id) !== String(documentId))
              )}
              onClose={() => setSourcesOpen(false)}
            />
          )}
        </aside>
      </section>
      {documentPickerOpen && (
        <div className="workspace-document-picker-backdrop" onMouseDown={() => setDocumentPickerOpen(false)}>
          <section
            className="workspace-document-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Select ready documents"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <label className="workspace-document-picker-search">
              <Search size={19} aria-hidden="true" />
              <input
                autoFocus
                type="search"
                value={documentPickerQuery}
                placeholder="Search ready documents..."
                onChange={(event) => setDocumentPickerQuery(event.target.value)}
              />
              <button type="button" aria-label="Close document selector" onClick={() => setDocumentPickerOpen(false)}>
                <X size={18} />
              </button>
            </label>
            <div className="workspace-document-picker-heading">
              <div>
                <strong>Ready documents</strong>
                <span>Select documents to use in this chat</span>
              </div>
              <small>{context.length} selected</small>
            </div>
            <div className="workspace-ready-document-list">
              {visibleReadyDocuments.map((document) => {
                const documentId = String(document.id);
                const selected = context.some((id) => String(id) === documentId);
                const filename = document.filename || document.name || document.title || "document";
                const extension = filename.includes(".") ? filename.split(".").pop().toUpperCase() : "FILE";
                return (
                  <button
                    type="button"
                    className={selected ? "selected" : ""}
                    key={documentId}
                    onClick={() => toggleDocumentContext(documentId)}
                    aria-pressed={selected}
                  >
                    <span className="workspace-ready-document-icon"><FileText size={20} /></span>
                    <span className="workspace-ready-document-copy">
                      <strong>{document.title || document.filename || "Untitled document"}</strong>
                      <small>{extension} · Ready</small>
                    </span>
                    <span className="workspace-ready-document-check" aria-hidden="true">{selected ? "✓" : "+"}</span>
                  </button>
                );
              })}
              {!visibleReadyDocuments.length && (
                <p className="workspace-ready-document-empty">
                  {documentPickerQuery ? "No ready documents match your search." : "No ready documents are available yet."}
                </p>
              )}
            </div>
            <div className="workspace-document-picker-footer">
              <button type="button" className="workspace-document-picker-clear" onClick={() => setContext([])}>Clear</button>
              <button type="button" className="workspace-document-picker-done" onClick={() => setDocumentPickerOpen(false)}>
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
