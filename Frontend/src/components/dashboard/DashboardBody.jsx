import useSWR from "swr";
import { ArrowRight, FileText, MessageSquareText, Upload } from "lucide-react";
import {
  listWorkspaceDocuments,
  WORKSPACE_DOCUMENTS_CACHE_KEY,
} from "../../Actions/DashboardAction.js";
import {
  listChatSessions,
  WORKSPACE_CHAT_SESSIONS_CACHE_KEY,
} from "../../Actions/ChatAction.js";
import { CircularLoader } from "../Loader.jsx";

const getRows = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const statusLabel = (status) => ({
  uploaded: "Uploaded",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
}[String(status || "").toLowerCase()] || status || "Unknown");

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function DashboardBody({ onNavigate, userName = "there", onSignOut }) {
  const {
    data: documentData,
    error: documentError,
    isLoading: documentsLoading,
  } = useSWR(
    WORKSPACE_DOCUMENTS_CACHE_KEY,
    () => listWorkspaceDocuments({ page: 1, limit: 100 }),
    {
      refreshInterval: (currentData) => {
        const rows = getRows(currentData, "documents");
        return rows.some((document) => ["uploaded", "processing"].includes(String(document.status || "").toLowerCase()))
          ? 2500
          : 0;
      },
    },
  );
  const {
    data: chatData,
    error: chatError,
    isLoading: chatsLoading,
  } = useSWR(
    WORKSPACE_CHAT_SESSIONS_CACHE_KEY,
    () => listChatSessions(1, 100),
    { revalidateOnFocus: true },
  );

  const documents = getRows(documentData, "documents");
  const chats = getRows(chatData, "sessions");
  const documentTotal = documentData?.total ?? documentData?.data?.total ?? documents.length;
  const chatTotal = chatData?.total ?? chatData?.data?.total ?? chats.length;
  const loading = documentsLoading || chatsLoading;
  const error = documentError?.message || chatError?.message || "";
  const readyCount = documents.filter((document) => String(document.status).toLowerCase() === "ready").length;
  const processingCount = documents.filter((document) => ["uploaded", "processing"].includes(String(document.status).toLowerCase())).length;
  const recentDocuments = [...documents]
    .sort((a, b) => (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0))
    .slice(0, 4);
  const recentChats = [...chats]
    .sort((a, b) => (new Date(b.updated_at || 0).getTime() || 0) - (new Date(a.updated_at || 0).getTime() || 0))
    .slice(0, 5);

  return (
    <main className="dashboard-main">
      {loading && <CircularLoader overlay label="Loading dashboard" />}
      <div className="dashboard-page-heading">
        <div>
          <p>Workspace overview</p>
          <h1>{greeting()}, {userName}</h1>
          <span>Here&apos;s what&apos;s happening across your knowledge workspace.</span>
        </div>
        <time dateTime={new Date().toISOString().slice(0, 10)}>
          {new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
        </time>
      </div>

      <section className="dashboard-stats" aria-label="Workspace statistics">
        <article>
          <div className="dashboard-stat-top"><span>Total documents</span><FileText size={18} /></div>
          <strong>{documentTotal}</strong>
          <p>Documents in your library</p>
        </article>
        <article>
          <div className="dashboard-stat-top"><span>Ready to query</span><MessageSquareText size={18} /></div>
          <strong>{readyCount}</strong>
          <p>{processingCount ? `${processingCount} document${processingCount === 1 ? "" : "s"} processing or queued` : "Documents ready to query"}</p>
        </article>
        <article>
          <div className="dashboard-stat-top"><span>Conversations</span><MessageSquareText size={18} /></div>
          <strong>{chatTotal}</strong>
          <p>Saved workspace conversations</p>
        </article>
      </section>

      {error && <p className="dashboard-empty-state dashboard-error" role="alert">{error}</p>}

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-conversations">
          <div className="dashboard-panel-heading">
            <div><h2>Recent conversations</h2><p>Questions explored with your documents</p></div>
            <button type="button" onClick={() => onNavigate("Ask উপলব্ধি")}>View all <ArrowRight size={13} /></button>
          </div>
          <div>
            {loading && <p className="dashboard-empty-state">Loading workspace activity...</p>}
            {!loading && recentChats.map((chat) => (
              <button
                className="dashboard-conversation-row"
                type="button"
                key={chat.chat_id || chat.id}
                onClick={() => onNavigate("Ask উপলব্ধি", chat.chat_id || chat.id)}
              >
                <span className="dashboard-row-icon"><MessageSquareText size={17} /></span>
                <span><strong>{chat.title || "Untitled conversation"}</strong><small>Updated {formatDate(chat.updated_at)}</small></span>
                <ArrowRight size={16} />
              </button>
            ))}
            {!loading && !recentChats.length && !error && <p className="dashboard-empty-state">No conversations yet.</p>}
          </div>
        </article>

        <aside className="dashboard-panel dashboard-document-panel">
          <div className="dashboard-panel-heading">
            <div><h2>Recent documents</h2><p>Recently added to your library</p></div>
            <button type="button" onClick={() => onNavigate("Documents")}>View all <ArrowRight size={13} /></button>
          </div>
          <div>
            {recentDocuments.map((document) => (
              <button
                className="dashboard-document-row"
                type="button"
                key={document.id || document.document_id || document._id}
                onClick={() => onNavigate("Documents", document.id || document.document_id || document._id)}
              >
                <span className="dashboard-file-icon"><FileText size={18} /></span>
                <span><strong>{document.title || document.filename}</strong><small>{document.filename} · {formatDate(document.created_at)}</small></span>
                <em className={["processing", "uploaded"].includes(String(document.status).toLowerCase()) ? "processing" : ""}>{statusLabel(document.status)}</em>
              </button>
            ))}
            {!loading && !recentDocuments.length && !error && <p className="dashboard-empty-state">No documents yet.</p>}
          </div>
          <button className="dashboard-upload-button" type="button" onClick={() => onNavigate("Documents")}>
            <Upload size={16} /> Upload document
          </button>
        </aside>
      </section>

      {onSignOut && <button className="dashboard-mobile-signout" type="button" onClick={onSignOut}>Sign out</button>}
    </main>
  );
}
