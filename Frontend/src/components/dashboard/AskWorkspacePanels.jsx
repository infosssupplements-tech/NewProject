import { useEffect, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCw,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { CircularLoader } from "../Loader.jsx";

const getChatId = (chat) => String(chat.chat_id ?? chat.id ?? "");

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getHistoryGroup = (value) => {
  if (!value) return "Earlier";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysAgo = Math.floor((todayStart.getTime() - dateStart.getTime()) / 86_400_000);

  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo <= 7) return "Previous 7 days";
  return "Earlier";
};

export function ChatHistoryPanel({
  chats,
  activeChat,
  collapsed,
  onToggleCollapsed,
  onNewChat,
  newChatDisabled = false,
  onSelectChat,
  onRemoveChat,
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const filteredChats = chats
    .filter((chat) => (chat.title || "Untitled conversation").toLowerCase().includes(query.toLowerCase()))
    .sort((first, second) => new Date(second.updated_at || second.created_at || 0) - new Date(first.updated_at || first.created_at || 0));
  const groupedChats = filteredChats.reduce((groups, chat) => {
    const label = getHistoryGroup(chat.updated_at || chat.created_at);
    const group = groups.get(label) || [];
    group.push(chat);
    groups.set(label, group);
    return groups;
  }, new Map());

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLower === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const searchResults = chats
    .filter((chat) => {
      const searchText = `${chat.title || ""} ${chat.preview || ""} ${chat.last_message || ""}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    })
    .sort((first, second) => new Date(second.updated_at || second.created_at || 0) - new Date(first.updated_at || first.created_at || 0));

  return (
    <aside className={`workspace-panel workspace-chat-history ${collapsed ? "is-collapsed" : ""}`} aria-label="Chat history">
      <div className="workspace-history-heading">
        <div className="workspace-history-heading-copy">
          <h2>Chat History</h2>
          <span>{chats.length} {chats.length === 1 ? "conversation" : "conversations"}</span>
        </div>
        <div className="workspace-history-actions">
          <button
            type="button"
            className="workspace-history-search-button"
            aria-label="Search chats"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={17} />
          </button>
          <button
            type="button"
            className="workspace-history-toggle"
            aria-label={collapsed ? "Expand chat history" : "Collapse chat history"}
            aria-expanded={!collapsed}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <button type="button" className="workspace-history-new-chat" onClick={onNewChat} disabled={newChatDisabled}>
            <Plus size={18} />
            <span>New chat</span>
          </button>
          <div className="workspace-history-list">
            {groupedChats.size === 0 && (
              <p className="workspace-empty">
                {query ? "No conversations match your search." : "No conversations yet. Start a new chat to see it here."}
              </p>
            )}
            {[...groupedChats.entries()].map(([group, groupChats]) => (
              <section className="workspace-history-group" key={group}>
                <h3>{group}</h3>
                {groupChats.map((chat) => {
                  const chatId = getChatId(chat);
                  const meta = formatTime(chat.updated_at || chat.created_at);

                  return (
                    <article className={String(activeChat) === chatId ? "active" : ""} key={chatId}>
                      <button type="button" className="workspace-history-main" onClick={() => onSelectChat(chat)}>
                        <strong>{chat.title || "Untitled conversation"}</strong>
                        <small>{meta || formatTime(chat.updated_at || chat.created_at) || "Saved"}</small>
                      </button>
                      <button
                        type="button"
                        className="workspace-history-delete"
                        aria-label={`Delete ${chat.title || "conversation"}`}
                        onClick={() => onRemoveChat(chatId)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </article>
                  );
                })}
              </section>
            ))}
          </div>
        </>
      )}
      {searchOpen && (
        <div className="workspace-chat-search-backdrop" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <section
            className="workspace-chat-search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search chats"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <label className="workspace-chat-search-input">
              <Search size={20} aria-hidden="true" />
              <input
                autoFocus
                type="search"
                value={query}
                placeholder="Search chats..."
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}>
                <X size={18} />
              </button>
            </label>
            <div className="workspace-chat-search-results">
              <span>{query ? "Search results" : "Recent chats"}</span>
              {searchResults.map((chat) => (
                <button
                  type="button"
                  key={getChatId(chat)}
                  onClick={() => {
                    onSelectChat(chat);
                    setSearchOpen(false);
                  }}
                >
                  <span className="workspace-chat-search-result-icon" />
                  <strong>{chat.title || "Untitled conversation"}</strong>
                  <small>{formatTime(chat.updated_at || chat.created_at) || "Saved conversation"}</small>
                </button>
              ))}
              {!searchResults.length && <p>No conversations match your search.</p>}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}

const renderAnswerContent = (text, citations, onCitationSelect) =>
  String(text || "")
    .split(/\n+/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph, paragraphIndex) => (
      <p key={`paragraph-${paragraphIndex}`}>
        {paragraph.split(/(\[\d+\])/g).map((part, partIndex) => {
          const citationMatch = part.match(/^\[(\d+)\]$/);
          if (!citationMatch) return part;
          const citationIndex = Number(citationMatch[1]) - 1;
          if (!citations[citationIndex]) return part;
          return (
            <button
              className="workspace-inline-citation"
              type="button"
              key={`citation-${partIndex}`}
              onClick={() => onCitationSelect(citationIndex, citations)}
              aria-label={`Show source ${citationIndex + 1}`}
            >
              {part}
            </button>
          );
        })}
      </p>
    ));

export function ConversationPanel({
  title,
  contextCount,
  messages,
  citations,
  error,
  sending,
  question,
  setQuestion,
  onSendMessage,
  onClearContext,
  sourcesOpen,
  onShowSources,
  onAddDocuments,
  onCitationSelect,
  messagesEndRef,
}) {
  const [feedback, setFeedback] = useState(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [actionNotice, setActionNotice] = useState("");
  const lastQuestion = [...messages].reverse().find((message) => message.role === "user")?.text;
  const lastAssistantIndex = messages.reduce((latestIndex, message, index) => message.role === "assistant" ? index : latestIndex, -1);

  useEffect(() => {
    setFeedback(null);
    setCopiedMessageIndex(null);
    setActionNotice("");
  }, [messages.length]);

  const copyAnswer = async (text, messageIndex) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(messageIndex);
      setActionNotice("Answer copied.");
    } catch {
      setActionNotice("Clipboard access is unavailable in this browser.");
    }
  };

  return (
    <section className="workspace-panel workspace-chat-panel" aria-label="Ask উপলব্ধি conversation">
      <div className="workspace-chat-heading">
        <div className="workspace-chat-heading-copy">
          <strong>{title || "New conversation"}</strong>
          <span>{contextCount} {contextCount === 1 ? "document" : "documents"} in context · Answers are grounded in your sources</span>
        </div>
        <div className="workspace-chat-heading-actions">
          {!sourcesOpen && (
            <button type="button" className="workspace-show-sources" onClick={onShowSources}>
              <FileText size={14} /> Sources
            </button>
          )}
          <button type="button" className="workspace-clear-context" onClick={onClearContext}>Clear context</button>
        </div>
      </div>

      {error && <p className="workspace-chat-error" role="alert">{error}</p>}
      <div className="workspace-chat-messages" aria-live="polite">
        {!messages.length && (
          <div className="workspace-ask-empty">
            <span aria-hidden="true">উ</span>
            <div>
              <strong>Welcome to Ask উপলব্ধি</strong>
              <p>Select documents above, then ask a question about their contents.</p>
            </div>
          </div>
        )}
        {messages.map((message, index) => {
          const messageCitations = Array.isArray(message.citations) ? message.citations : [];
          const isLatestAssistant = index === lastAssistantIndex;

          if (message.role !== "assistant") {
            return (
              <div key={`${message.role}-${index}`} className="workspace-message user">
                <div className="workspace-user-bubble">
                  <p>{message.text}</p>
                  {formatTime(message.createdAt) && <time>{formatTime(message.createdAt)}</time>}
                </div>
              </div>
            );
          }

          return (
            <div key={`${message.role}-${index}`} className="workspace-message assistant">
              <span className="workspace-message-mark" aria-hidden="true">উ</span>
              <div className="workspace-answer-card">
                <div className="workspace-answer-heading">
                  <strong>উপলব্ধি</strong>
                  <span>Answering from {messageCitations.length} {messageCitations.length === 1 ? "source" : "sources"}</span>
                </div>
                <div className="workspace-answer-content">
                  {renderAnswerContent(message.text, messageCitations, onCitationSelect)}
                </div>
                {isLatestAssistant && (
                  <div className="workspace-answer-footer">
                    <span className="workspace-answer-confidence">
                      <Check size={13} /> {messageCitations.length ? `Grounded in ${messageCitations.length} ${messageCitations.length === 1 ? "source" : "sources"}` : "Verify against your documents"}
                    </span>
                    <div className="workspace-answer-actions">
                      <button type="button" onClick={() => copyAnswer(message.text, index)}>
                        {copiedMessageIndex === index ? <Check size={12} /> : <Copy size={12} />}
                        {copiedMessageIndex === index ? "Copied" : "Copy"}
                      </button>
                      <button type="button" disabled={sending || !lastQuestion} onClick={() => onSendMessage(undefined, lastQuestion)}>
                        <RotateCw size={12} /> Regenerate
                      </button>
                      <button className={feedback === "useful" ? "selected" : ""} type="button" aria-pressed={feedback === "useful"} onClick={() => setFeedback("useful")}>
                        <ThumbsUp size={12} /> Useful
                      </button>
                      <button className={feedback === "not-useful" ? "selected" : ""} type="button" aria-pressed={feedback === "not-useful"} onClick={() => setFeedback("not-useful")}>
                        <ThumbsDown size={12} /> Not useful
                      </button>
                    </div>
                    {actionNotice && <span className="workspace-action-notice" role="status">{actionNotice}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="workspace-thinking" role="status" aria-label="Upolabdhi is preparing an answer">
            <strong>উপলব্ধি</strong>
            <span aria-hidden="true"><i /><i /><i /></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="workspace-ask-prompts" aria-label="Suggested prompts">
        {["Give me a 30-second overview", "Make a study plan", "Explain step by step"].map((prompt) => (
          <button type="button" key={prompt} onClick={() => setQuestion(prompt)}>{prompt}</button>
        ))}
      </div>
      <form className="workspace-composer" onSubmit={onSendMessage}>
        <label className="workspace-visually-hidden" htmlFor="ask-question">Ask a question about your documents</label>
        <textarea
          id="ask-question"
          rows="2"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about your documents..."
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
              event.preventDefault();
              onSendMessage(event);
            }
          }}
        />
        <div className="workspace-composer-footer">
          <div>
            <button type="button" className="workspace-add-documents" onClick={onAddDocuments}>
              <Plus size={13} /> Add documents
            </button>
            <span>Enter to send · Shift + Enter for a new line</span>
          </div>
          <button type="submit" aria-label={sending ? "Sending message" : "Send message"} disabled={!question.trim() || sending}>
            {sending ? <CircularLoader label="Sending" /> : <ArrowUp size={19} />}
          </button>
        </div>
      </form>
      <p className="workspace-composer-note">Grounded AI can make mistakes. Verify important details in the cited sources.</p>
    </section>
  );
}

const getRelevance = (citation) => {
  const rawValue = citation.relevance ?? citation.score ?? citation.similarity;
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;
  const numericValue = typeof rawValue === "string" ? Number.parseFloat(rawValue) : Number(rawValue);
  if (!Number.isFinite(numericValue)) return null;
  return `${Math.round(numericValue <= 1 ? numericValue * 100 : numericValue)}%`;
};

export function SourcesPanel({ citations, documents, contextDocuments = [], activeSourceIndex, onSelectSource, onRemoveDocument, onClose }) {
  return (
    <aside className="workspace-panel workspace-sources-panel" aria-label="Sources for the current answer">
      <div className="workspace-sources-heading">
        <div>
          <h2>Sources</h2>
          <span>{contextDocuments.length} {contextDocuments.length === 1 ? "document" : "documents"} · {citations.length} {citations.length === 1 ? "citation" : "citations"}</span>
        </div>
        <button type="button" aria-label="Close sources panel" onClick={onClose}><X size={18} /></button>
      </div>
      {!!contextDocuments.length && (
        <div className="workspace-context-source-list" aria-label="Selected source documents">
          {contextDocuments.map((document, index) => {
            const filename = document.filename || document.name || document.title || `Document ${index + 1}`;
            const title = document.title || document.name || filename;
            const extension = filename.includes(".") ? filename.split(".").pop().toUpperCase() : "DOC";
            return (
              <article className="workspace-context-source-card" key={String(document.id ?? document.document_id ?? document._id ?? index)}>
                <span className={`workspace-source-file-icon ${extension.toLowerCase()}`}><FileText size={18} /></span>
                <div>
                  <strong>{title}</strong>
                  <small>{extension} · Selected document</small>
                </div>
                <button
                  type="button"
                  className="workspace-context-source-remove"
                  aria-label={`Remove ${title} from chat context`}
                  onClick={() => onRemoveDocument(document.id ?? document.document_id ?? document._id)}
                >
                  <X size={14} />
                </button>
              </article>
            );
          })}
        </div>
      )}
      {citations.length ? (
        <div className="workspace-source-list">
          {citations.map((citation, index) => {
            const document = documents.find((item) => String(item.id ?? item.document_id ?? item._id) === String(citation.document_id ?? citation.documentId));
            const filename = document?.filename || citation.filename || document?.title || `Document ${index + 1}`;
            const name = document?.title || filename;
            const extension = filename.includes(".") ? filename.split(".").pop().toUpperCase() : "DOC";
            const page = citation.page ?? citation.page_number;
            const chunk = citation.chunk_id ? `Chunk ${citation.chunk_id}` : `Citation ${index + 1}`;
            const relevance = getRelevance(citation);
            const metadata = [chunk, relevance ? `Relevance ${relevance}` : null].filter(Boolean).join(" · ");

            return (
              <article className={`workspace-source-card ${activeSourceIndex === index ? "active" : ""}`} key={citation.chunk_id || `${citation.document_id}-${index}`}>
                <div className="workspace-source-card-heading">
                  <span className={`workspace-source-file-icon ${extension.toLowerCase()}`}><FileText size={19} /></span>
                  <div>
                    <strong>{name}</strong>
                    <small>{metadata}</small>
                  </div>
                  <span className="workspace-source-page">{page ? `Page ${page}` : ""}</span>
                </div>
                <p>{citation.text || "The source passage was returned without an excerpt."}</p>
                <button
                  type="button"
                  className="workspace-source-open"
                  aria-pressed={activeSourceIndex === index}
                  onClick={() => onSelectSource(index)}
                >
                  Select source <ArrowUpRight size={12} />
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="workspace-empty workspace-source-empty">Sources cited by the current answer will appear here.</p>
      )}
      <p className="workspace-sources-note">Source excerpts are returned with your answer. Verify important details in the original document.</p>
    </aside>
  );
}
