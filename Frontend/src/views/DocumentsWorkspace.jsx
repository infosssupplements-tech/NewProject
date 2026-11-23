import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { MoreVertical, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import FileTypeIcon from "../components/dashboard/FileTypeIcon.jsx";
import {
  deleteAllDocuments,
  deleteDocument,
  getDocumentDetails,
  listWorkspaceDocuments,
  uploadDocument,
  updateDocument,
  WORKSPACE_DOCUMENTS_CACHE_KEY,
} from "../Actions/DashboardAction.js";
import { CircularLoader } from "../components/Loader.jsx";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getDocumentKeywords = (document) => {
  const supplied = document.keywords ?? document.tags;
  const suppliedKeywords = Array.isArray(supplied)
    ? supplied
    : typeof supplied === "string"
      ? supplied.split(/[\n,]+/)
      : [];
  const filename = (document.filename || document.name || document.title || "").replace(/\.[^.]+$/, "");
  const fallbackKeywords = filename.split(/[_\s-]+/).filter((word) => word && !/^v?\d+$/i.test(word) && !["by", "the", "and"].includes(word.toLowerCase()));

  return [...new Set((suppliedKeywords.length ? suppliedKeywords : fallbackKeywords)
    .map((keyword) => String(keyword).trim())
    .filter(Boolean))].slice(0, 4);
};

const toProgress = (value, fallback) => {
  const progress = Number(value);
  return Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : fallback;
};

const formatProcessingStep = (step) => String(step || "")
  .replace(/[_-]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .replace(/^./, (character) => character.toUpperCase());

const normalizeDocument = (document) => {
  const statusKey = String(document.status || "uploaded").toLowerCase();
  const processing = document.processing || {};
  const metadata = document.metadata || {};
  const chunkCount = document.chunk_count ?? document.chunks_count ?? document.indexed_chunks ?? metadata.chunk_count ?? document.chunks ?? 0;
  const progress = toProgress(processing.progress ?? document.progress, statusKey === "ready" ? 100 : 0);
  const currentStep = processing.current_step ?? processing.currentStep ?? document.current_step ?? null;
  const processingError = processing.error ?? document.processing_error ?? document.error ?? null;

  return {
    id: document.id ?? document.document_id ?? document._id,
    raw: document,
    name: document.title || document.name || document.filename || "Untitled document",
    filename: document.filename || document.name || document.title || "document",
    type: (document.filename?.split(".").pop() || document.mime_type?.split("/").pop() || "file").toUpperCase(),
    size: formatBytes(Number(document.size ?? document.file_size ?? 0)),
    pages: document.page_count ?? metadata.page_count ?? document.pages ?? document.num_pages ?? "—",
    uploaded: document.created_at ? new Date(document.created_at).toLocaleDateString() : "",
    uploadedAt: document.created_at ? new Date(document.created_at).getTime() : 0,
    status: ({ uploaded: "Uploaded", processing: "Processing", ready: "Ready", failed: "Failed" })[statusKey] || String(document.status || "Uploaded"),
    chunks: Array.isArray(chunkCount) ? chunkCount.length : Number(chunkCount) || 0,
    progress,
    currentStep,
    processingError: processingError ? String(processingError) : "",
    summary: document.summary || document.overview || document.description || null,
    keywords: getDocumentKeywords(document),
  };
};

const getDocumentRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.documents)) return response.documents;
  if (Array.isArray(response?.data?.documents)) return response.data.documents;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getUploadedDocuments = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.documents) return response.documents;
  if (response?.document) return response.document;
  if (response?.data) return getUploadedDocuments(response.data);
  return response;
};

const unwrapDocumentResponse = (response) => response?.document ?? response?.data?.document ?? response?.data ?? response;

const DOCUMENT_DETAILS_CACHE_KEY = "kali-document-details-v1";
const DOCUMENT_DETAILS_FINGERPRINT_KEY = "kali-document-details-fingerprints-v1";

const readDocumentDetailsCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(DOCUMENT_DETAILS_CACHE_KEY) || "{}");
    return cached && typeof cached === "object" ? cached : {};
  } catch {
    return {};
  }
};

const writeDocumentDetailsCache = (details) => {
  try {
    localStorage.setItem(DOCUMENT_DETAILS_CACHE_KEY, JSON.stringify(details));
  } catch {
    // API-backed in-memory document details remain usable.
  }
};

const readDocumentFingerprints = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(DOCUMENT_DETAILS_FINGERPRINT_KEY) || "{}");
    return cached && typeof cached === "object" ? cached : {};
  } catch {
    return {};
  }
};

const writeDocumentFingerprints = (fingerprints) => {
  try {
    localStorage.setItem(DOCUMENT_DETAILS_FINGERPRINT_KEY, JSON.stringify(fingerprints));
  } catch {
    // API-backed in-memory details remain usable.
  }
};

const documentFingerprint = (document) => String(document.status ?? "");

const hasRichDocumentDetails = (detail) => Boolean(
  detail && (
    detail.processing
    || detail.metadata
    || detail.overview != null
    || detail.summary != null
    || typeof detail.chunk_count === "number"
  )
) && !(
  String(detail.status || "").toLowerCase() === "ready"
  && detail.overview == null
  && detail.summary == null
);

const getDefinedDocument = (document, fallback = {}) => ({
  ...fallback,
  ...Object.fromEntries(Object.entries(document || {}).filter(([, value]) => value !== undefined)),
});

const getStatusCopy = (document) => {
  if (document.status === "Ready") return "Document is ready.";
  if (document.status === "Failed") {
    return document.processingError
      ? `Processing failed: ${document.processingError}`
      : "Processing failed. Upload a readable file to try again.";
  }
  if (document.status === "Uploaded") return "Document uploaded. Waiting for indexing to start.";
  if (document.currentStep) return `Processing: ${formatProcessingStep(document.currentStep)}.`;
  if (document.status === "Uploading") return "Uploading document to the server.";
  return "Document is being prepared for indexing.";
};

const isActiveProcessing = (document) => ["Uploaded", "Processing", "Uploading"].includes(document.status);

export default function DocumentsWorkspace({ onAskDocument, initialDocumentId = null }) {
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [menuId, setMenuId] = useState(null);
  const [pendingUpload, setPendingUpload] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [pageDragging, setPageDragging] = useState(false);
  const fileInput = useRef(null);
  const hasAutoSelected = useRef(false);
  const [detailsRevision, setDetailsRevision] = useState(0);
  const {
    data,
    error: loadError,
    isLoading,
    mutate,
  } = useSWR(
    WORKSPACE_DOCUMENTS_CACHE_KEY,
    () => listWorkspaceDocuments({ page: 1, limit: 100 }),
    {
      keepPreviousData: true,
      revalidateOnMount: true,
      refreshInterval: (currentData) => getDocumentRows(currentData).some((document) =>
        ["uploaded", "processing"].includes(String(document.status || "").toLowerCase())
      ) ? 2500 : 0,
    },
  );

  const [documentDetailsById, setDocumentDetailsById] = useState(readDocumentDetailsCache);
  const [loadingDetailIds, setLoadingDetailIds] = useState(new Set());
  const detailRequestIds = useRef(new Set());

  useEffect(() => {
    const rows = getDocumentRows(data);
    if (!rows.length) {
      setLoadingDetailIds(new Set());
      return undefined;
    }

    const rowIds = rows
      .map((row) => row.id ?? row.document_id ?? row._id)
      .filter((documentId) => documentId != null)
      .map(String);
    const uniqueRowIds = [...new Set(rowIds)];
    const cachedDetails = documentDetailsById;
    const cachedFingerprints = readDocumentFingerprints();
    const idsToFetch = uniqueRowIds.filter((documentId) => {
      const row = rows.find((item) => String(item.id ?? item.document_id ?? item._id) === documentId);
      if (!row) return false;
      if (detailRequestIds.current.has(documentId)) return false;
      return !hasRichDocumentDetails(cachedDetails[documentId])
        || cachedFingerprints[documentId] !== documentFingerprint(row);
    });
    if (!idsToFetch.length) return undefined;

    setLoadingDetailIds(new Set(idsToFetch.filter((documentId) => !documentDetailsById[String(documentId)])));
    idsToFetch.forEach((documentId) => detailRequestIds.current.add(documentId));
    Promise.all(rows.map(async (row) => {
      const documentId = row.id ?? row.document_id ?? row._id;
      if (documentId == null) return null;
      if (!idsToFetch.includes(String(documentId))) return null;
      try {
        const detail = unwrapDocumentResponse(await getDocumentDetails(documentId));
        return [String(documentId), detail || row];
      } catch {
        return null;
      }
    })).then((entries) => {
        const details = Object.fromEntries(entries.filter(Boolean));
        Object.entries(details).forEach(([documentId, detail]) => {
          if (!detail?.id && !detail?.document_id && !detail?._id) {
            detail.id = documentId;
          }
        });
        setDocumentDetailsById((current) => {
          const next = { ...current, ...details };
          writeDocumentDetailsCache(next);
          return next;
        });
        const fingerprints = readDocumentFingerprints();
        rows.forEach((row) => {
          const documentId = String(row.id ?? row.document_id ?? row._id);
          if (details[documentId]) fingerprints[documentId] = documentFingerprint(row);
        });
        writeDocumentFingerprints(fingerprints);
        idsToFetch.forEach((documentId) => detailRequestIds.current.delete(documentId));
        setLoadingDetailIds((current) => {
          const next = new Set(current);
          idsToFetch.forEach((documentId) => next.delete(documentId));
          return next;
        });
        idsToFetch.forEach((documentId) => detailRequestIds.current.delete(documentId));
    });
    return undefined;
  }, [data, detailsRevision]);

  const documents = getDocumentRows(data).map((row) => {
    const documentId = row.id ?? row.document_id ?? row._id;
    const detail = documentDetailsById[String(documentId)];
    return normalizeDocument(detail ? { ...detail, ...row } : row);
  }).filter((document) => document.id != null);
  const listedIds = new Set(documents.map((document) => String(document.id)));
  const pendingRows = pendingUpload.filter((document) => !document.id || !listedIds.has(String(document.id)));
  const allDocuments = [...pendingRows, ...documents];
  const selectedListDocument = allDocuments.find((document) => String(document.id) === String(selectedId));
  const selectedRawDocument = selectedListDocument?.raw ?? selectedListDocument;
  const detailKey = selectedRawDocument?.id != null
    && !String(selectedRawDocument.id).startsWith("uploading-")
    ? ["document-details", String(selectedRawDocument.id)]
    : null;
  const {
    data: detailResponse,
    error: detailError,
    mutate: mutateDocumentDetails,
  } = useSWR(
    detailKey,
    ([, documentId]) => getDocumentDetails(documentId),
    {
      keepPreviousData: true,
      refreshInterval: (currentData) => {
        const currentDocument = unwrapDocumentResponse(currentData);
        const currentStatus = String(currentDocument?.status ?? selectedRawDocument?.status ?? "").toLowerCase();
        return ["uploaded", "processing"].includes(currentStatus) ? 2500 : 0;
      },
    },
  );
  const selectedDetail = unwrapDocumentResponse(detailResponse);
  const detailBelongsToSelectedDocument = selectedDetail?.id == null
    || String(selectedDetail.id) === String(selectedRawDocument?.id);
  const selected = selectedListDocument && selectedDetail && detailBelongsToSelectedDocument
    ? normalizeDocument({
      ...getDefinedDocument(selectedRawDocument),
      ...getDefinedDocument(selectedDetail, selectedRawDocument),
      processing: selectedDetail.processing ?? selectedRawDocument?.processing,
      metadata: { ...(selectedRawDocument?.metadata || {}), ...(selectedDetail.metadata || {}) },
      title: selectedRawDocument?.name || selectedDetail.title || selectedRawDocument?.title,
    })
    : selectedListDocument;

  const [displayedProgressById, setDisplayedProgressById] = useState({});
  const progressStartedAt = useRef({});
  const progressKey = selected
    ? `${selected.id}-${String(selected.status).toLowerCase()}`
    : "";
  const selectedProgressKey = selected ? String(selected.id) : "";
  const displayedProgress = selectedProgressKey && Object.prototype.hasOwnProperty.call(displayedProgressById, selectedProgressKey)
    ? displayedProgressById[selectedProgressKey]
    : Math.min(Number(selected?.progress) || 0, selected?.status === "Processing" ? 92 : 100);

  useEffect(() => {
    if (!selectedProgressKey) return;
    setDisplayedProgressById((current) => {
      const initialProgress = selected.status === "Ready"
        ? 100
        : Math.min(Number(selected.progress) || 0, selected.status === "Processing" ? 92 : 100);
      if (selected.status === "Ready") {
        return { ...current, [selectedProgressKey]: 100 };
      }
      if (Object.prototype.hasOwnProperty.call(current, selectedProgressKey)) return current;
      return { ...current, [selectedProgressKey]: initialProgress };
    });
  }, [progressKey]);

  useEffect(() => {
    if (!selected || !["Uploaded", "Processing"].includes(selected.status)) return undefined;

    const startedAt = progressStartedAt.current[selectedProgressKey] || Date.now();
    progressStartedAt.current[selectedProgressKey] = startedAt;
    const timer = window.setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const backendProgress = Math.max(0, Math.min(100, Number(selected.progress) || 0));
      const simulatedProgress = selected.status === "Uploaded"
        ? Math.min(8, elapsedSeconds * 0.35)
        : Math.min(92, 8 + elapsedSeconds * 0.9);
      const targetProgress = Math.min(92, Math.max(backendProgress, simulatedProgress));

      setDisplayedProgressById((currentProgress) => {
        const current = currentProgress[selectedProgressKey] ?? 0;
        if (current >= targetProgress) return currentProgress;
        return {
          ...currentProgress,
          [selectedProgressKey]: Math.min(targetProgress, current + Math.max(0.35, (targetProgress - current) * 0.12)),
        };
      });
    }, 500);

    return () => window.clearInterval(timer);
  }, [progressKey, selected?.progress, selected?.status]);

  const visibleProgress = selected?.status === "Ready"
    ? 100
    : selected?.status === "Failed"
      ? Math.max(0, Math.min(100, Number(selected.progress) || displayedProgress))
      : Math.round(displayedProgress);
  const error = actionError || loadError?.message || detailError?.message || "";

  useEffect(() => {
    if (initialDocumentId != null) setSelectedId(initialDocumentId);
  }, [initialDocumentId]);

  useEffect(() => {
    if (!isLoading && allDocuments.length && !hasAutoSelected.current && selectedId == null && initialDocumentId == null) {
      setSelectedId(allDocuments[0].id);
      hasAutoSelected.current = true;
    }
  }, [allDocuments.length, initialDocumentId, isLoading, selectedId]);

  const visibleDocuments = allDocuments
    .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => {
      if (status === "All") return true;
      if (status === "Processing") return ["Processing", "Uploaded", "Uploading"].includes(item.status);
      return item.status === status;
    })
    .sort((a, b) => {
      if (sort === "Name") {
        const byName = a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
        return byName || String(b.id).localeCompare(String(a.id));
      }
      const dateOrder = (b.uploadedAt || 0) - (a.uploadedAt || 0);
      return (sort === "Oldest" ? -dateOrder : dateOrder) || String(b.id).localeCompare(String(a.id));
    });

  const addFiles = async (files) => {
    const accepted = Array.from(files || []).filter((file) => /\.(pdf|doc|docx|txt)$/i.test(file.name));
    if (!accepted.length) {
      setActionError("Choose a PDF, DOC, DOCX, or TXT file to upload.");
      return;
    }

    const batchId = Date.now();
    const optimistic = accepted.map((file, index) => ({
      id: `uploading-${batchId}-${index}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      filename: file.name,
      type: (file.name.split(".").pop() || "file").toUpperCase(),
      size: formatBytes(file.size),
      pages: "—",
      uploaded: new Date().toLocaleDateString(),
      uploadedAt: Date.now(),
      status: "Uploading",
      chunks: 0,
      progress: 0,
      currentStep: null,
      processingError: "",
      summary: "Your document is being uploaded securely.",
      keywords: [],
    }));
    const optimisticIds = new Set(optimistic.map((document) => String(document.id)));

    try {
      setActionError("");
      setUploading(true);
      setPendingUpload((current) => [...optimistic, ...current]);
      const results = await Promise.allSettled(accepted.map((file) =>
        uploadDocument(file.name.replace(/\.[^.]+$/, ""), file)
      ));
      const uploadedRows = results.flatMap((result) => {
        if (result.status !== "fulfilled") return [];
        const payload = getUploadedDocuments(result.value);
        return (Array.isArray(payload) ? payload : [payload])
          .filter((document) => document && typeof document === "object")
          .map(normalizeDocument)
          .filter((document) => document.id != null);
      });
      const failures = results.filter((result) => result.status === "rejected");

      setPendingUpload((current) => [
        ...uploadedRows,
        ...current.filter((document) => !optimisticIds.has(String(document.id))),
      ]);
      if (uploadedRows[0]) {
        setSelectedId(uploadedRows[0].id);
        hasAutoSelected.current = true;
      }
      if (failures.length) {
        setActionError(`${failures.length} of ${accepted.length} upload${accepted.length === 1 ? "" : "s"} failed. ${failures[0].reason?.message || "Please try again."}`);
      }
      try {
        const refreshed = await mutate();
        const refreshedIds = new Set(getDocumentRows(refreshed).map((document) =>
          String(document.id ?? document.document_id ?? document._id)
        ));
        setPendingUpload((current) => current.filter((document) => !document.id || !refreshedIds.has(String(document.id))));
      } catch {
        // Keep the successful upload response visible until the next revalidation.
      }
      setDetailsRevision((revision) => revision + 1);
      if (!uploadedRows.length && !failures.length) {
        setActionError("The upload completed, but the server did not return a document record. Refresh the library to check its status.");
      }
    } catch (requestError) {
      setActionError(requestError.message || "Document upload failed.");
      setPendingUpload((current) => current.filter((document) => !optimisticIds.has(String(document.id))));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removeDocument = async (document) => {
    if (!window.confirm(`Delete "${document.name}" from your workspace?`)) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteDocument(document.id);
      setPendingUpload((current) => current.filter((item) => String(item.id) !== String(document.id)));
      if (String(selectedId) === String(document.id)) setSelectedId(null);
      setMenuId(null);
      try { await mutate(); } catch { /* The delete succeeded; SWR will retry the list request. */ }
      setDetailsRevision((revision) => revision + 1);
      setDocumentDetailsById((current) => {
        const next = { ...current };
        delete next[String(document.id)];
        writeDocumentDetailsCache(next);
        return next;
      });
      const fingerprints = readDocumentFingerprints();
      delete fingerprints[String(document.id)];
      writeDocumentFingerprints(fingerprints);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to delete the document.");
    } finally {
      setDeleting(false);
    }
  };

  const startRename = (document) => {
    setRenameId(document.id);
    setRenameValue(document.name);
    setMenuId(null);
    setActionError("");
  };

  const cancelRename = () => {
    setRenameId(null);
    setRenameValue("");
  };

  const saveRename = async (document) => {
    const title = renameValue.trim();
    if (!title) {
      setActionError("Document name cannot be empty.");
      return;
    }

    setRenaming(true);
    setActionError("");
    try {
      const response = await updateDocument(document.id, { title });
      const updatedDocument = unwrapDocumentResponse(response) ?? { ...document.raw, id: document.id, title };
      await mutate((current) => {
        const rows = getDocumentRows(current).map((row) => {
          const rowId = row.id ?? row.document_id ?? row._id;
          return String(rowId) === String(document.id) ? { ...row, ...updatedDocument, title } : row;
        });
        return Array.isArray(current) ? rows : { ...current, documents: rows };
      }, { revalidate: false });
      const detailUpdate = {
        ...updatedDocument,
        id: document.id,
        title,
      };
      setDocumentDetailsById((current) => {
        const next = {
          ...current,
          [String(document.id)]: {
            ...(current[String(document.id)] || {}),
            ...detailUpdate,
          },
        };
        writeDocumentDetailsCache(next);
        return next;
      });
      await mutateDocumentDetails(detailUpdate, { revalidate: false });
      setPendingUpload((current) => current.map((item) =>
        String(item.id) === String(document.id) ? { ...item, name: title, title, raw: { ...item.raw, title } } : item
      ));
      cancelRename();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to rename the document.");
    } finally {
      setRenaming(false);
    }
  };

  const removeAllDocuments = async () => {
    if (!window.confirm("Delete all documents from your workspace?")) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteAllDocuments();
      setPendingUpload([]);
      setSelectedId(null);
      setMenuId(null);
      try { await mutate(); } catch { /* The delete succeeded; SWR will retry the list request. */ }
      setDetailsRevision((revision) => revision + 1);
      setDocumentDetailsById({});
      writeDocumentDetailsCache({});
      writeDocumentFingerprints({});
    } catch (requestError) {
      setActionError(requestError.message || "Unable to delete all documents.");
    } finally {
      setDeleting(false);
    }
  };

  const selectDocument = (documentId) => {
    setSelectedId(documentId);
    hasAutoSelected.current = true;
    mutateDocumentDetails();
  };

  return (
    <main
      className={`workspace-page ${uploading || deleting ? "workspace-operation-loading" : ""} ${pageDragging ? "workspace-page-dragging" : ""}`}
      onDragEnter={(event) => {
        if (event.dataTransfer?.types?.includes("Files")) {
          event.preventDefault();
          setPageDragging(true);
        }
      }}
      onDragOver={(event) => {
        if (event.dataTransfer?.types?.includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPageDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setPageDragging(false);
        if (!uploading && !deleting) addFiles(event.dataTransfer.files);
      }}
    >
      {pageDragging && !uploading && !deleting && (
        <div className="workspace-page-drop-overlay" role="status">
          <Upload size={28} />
          <strong>Drop files anywhere to upload</strong>
          <span>PDF, DOC, DOCX or TXT</span>
        </div>
      )}
      {(uploading || deleting) && (
        <div className="workspace-operation-overlay" role="status" aria-live="polite">
          <CircularLoader label={uploading ? "Uploading documents" : "Deleting documents"} />
        </div>
      )}
      

      <input ref={fileInput} className="workspace-visually-hidden" type="file" accept=".pdf,.doc,.docx,.txt" multiple onChange={(event) => addFiles(event.target.files)} />
      <div className="workspace-document-controls">
        <label className="workspace-documents-search">
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search by filename, topic, or keyword..." aria-label="Search documents" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="All">All statuses</option><option value="Ready">Ready</option><option value="Processing">Processing</option><option value="Failed">Failed</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort documents">
          <option value="Newest">Newest first</option><option value="Oldest">Oldest first</option><option value="Name">Name A–Z</option>
        </select>
        <button type="button" className="workspace-primary-button workspace-upload-button" disabled={uploading || deleting} onClick={() => fileInput.current?.click()}>
          {uploading ? <CircularLoader label="Uploading" /> : <Upload size={15} />} Upload document
        </button>
      </div>

      <section className={`workspace-document-layout ${selected ? "" : "details-hidden"}`}>
        <article className="workspace-panel workspace-library-panel">
          <div className="workspace-library-header">
            <div>
              <h2>All documents</h2>
              <span>{visibleDocuments.length} {visibleDocuments.length === 1 ? "document" : "documents"}</span>
            </div>
            {!!allDocuments.length && (
              <button type="button" className="workspace-danger-button workspace-delete-all" disabled={deleting || uploading} onClick={removeAllDocuments}>
                <Trash2 size={14} /> Delete all
              </button>
            )}
          </div>
          <div className="workspace-library-list">
            {visibleDocuments.map((item) => {
              const isProcessing = isActiveProcessing(item);
              return (
                <article key={item.id} className={`workspace-library-row ${String(selected?.id) === String(item.id) ? "selected" : ""}`}>
                  <button type="button" className="workspace-library-main" onClick={() => selectDocument(item.id)}>
                    <span className={`workspace-file-icon ${item.type.toLowerCase()}`}><FileTypeIcon type={item.type} /></span>
                    <span className="workspace-library-copy">
                      <strong>{item.name}</strong>
                      <small>{item.type} · {item.size} · {item.uploaded || "Recently uploaded"}</small>
                      <span className="workspace-library-state">
                        <em className={isProcessing ? "processing" : ""}>{item.status}</em>
                        <small>{item.status === "Preview only" ? "Not indexed" : `${item.chunks} chunks`}</small>
                      </span>
                    </span>
                  </button>
                  {String(renameId) === String(item.id) ? (
                    <form className="workspace-document-rename" onSubmit={(event) => { event.preventDefault(); saveRename(item); }}>
                      <label htmlFor={`rename-document-${item.id}`} className="workspace-visually-hidden">Document name</label>
                      <input
                        id={`rename-document-${item.id}`}
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        disabled={renaming}
                        autoFocus
                      />
                      <div>
                        <button type="submit" className="workspace-dark-button" disabled={renaming}>Save</button>
                        <button type="button" className="workspace-outline-button" disabled={renaming} onClick={cancelRename}>Cancel</button>
                      </div>
                    </form>
                  ) : null}
                  <p className="workspace-library-summary">{loadingDetailIds.has(String(item.id)) ? "Loading document details…" : (item.summary || "No summary is available for this document yet.")}</p>
                  <button type="button" className="workspace-library-view-more" onClick={() => selectDocument(item.id)}>View more <span aria-hidden="true">→</span></button>
                  <div className="workspace-library-actions">
                    <button type="button" className="workspace-outline-button" disabled={item.status !== "Ready"} onClick={() => onAskDocument(item)}>Ask about this</button>
                    <button type="button" className="workspace-dark-button" onClick={() => selectDocument(item.id)}>View details</button>
                    <div className="workspace-library-more">
                      <button type="button" aria-label={`Actions for ${item.name}`} onClick={() => setMenuId(menuId === item.id ? null : item.id)}>
                        <MoreVertical size={17} />
                      </button>
                      {menuId === item.id && (
                        <div className="workspace-document-menu">
                          <button type="button" onClick={() => startRename(item)} disabled={renaming || `${item.id}`.startsWith("uploading-")}><Pencil size={14} /> Rename document</button>
                          <button type="button" onClick={() => removeDocument(item)} disabled={deleting || `${item.id}`.startsWith("uploading-")}><Trash2 size={14} /> Delete document</button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {!isLoading && !visibleDocuments.length && <p className="workspace-empty">No documents match your search or filter.</p>}
        </article>

        <aside className="workspace-panel workspace-document-details">
          <div className="workspace-details-heading">
            <h2>Document details</h2>
            <button type="button" aria-label="Close document details" onClick={() => setSelectedId(null)}><X size={18} /></button>
          </div>
          {selected ? (
            <div className="workspace-details-content">
              <div className="workspace-detail-file">
                <span className={`workspace-file-icon ${selected.type.toLowerCase()}`}><FileTypeIcon type={selected.type} /></span>
                <div><strong>{selected.name}</strong><small>{selected.type}</small></div>
              </div>
              <section><h3>Summary</h3><p>{loadingDetailIds.has(String(selected.id)) ? "Loading document details…" : (selected.summary || "No summary is available for this document yet.")}</p></section>
              <section className="workspace-metadata-section">
                <h3>Metadata</h3>
                <div className="workspace-metadata">
                  <div><small>File size</small><strong>{selected.size}</strong></div>
                  <div><small>Page count</small><strong>{selected.pages}</strong></div>
                  <div><small>Uploaded</small><strong>{selected.uploaded || "Recently uploaded"}</strong></div>
                  <div><small>Status</small><strong>{selected.status}</strong></div>
                </div>
              </section>
              {isActiveProcessing(selected) && (
                <section>
                  <div className="workspace-progress-heading"><h3>Processing progress</h3><strong>{`${visibleProgress}%`}</strong></div>
                  <div
                    className="workspace-progress-track"
                    role="progressbar"
                    aria-label={`Document processing progress: ${visibleProgress}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={visibleProgress}
                  >
                    <span style={{ width: `${visibleProgress}%` }} />
                  </div>
                  <p className="workspace-progress-copy" aria-live="polite">{getStatusCopy(selected)}</p>
                </section>
              )}
              <section>
                <h3>Chunk information</h3>
                <p>{selected.chunks ? `${selected.chunks} indexed ${selected.chunks === 1 ? "chunk" : "chunks"} in this document.` : "No indexed chunks yet."}</p>
              </section>
              <section className="workspace-keywords-section">
                <h3>Important keywords</h3>
                <div className="workspace-keyword-list">
                  {selected.keywords.length ? selected.keywords.map((keyword) => <span key={keyword}>{keyword}</span>) : <span>No keywords yet</span>}
                </div>
              </section>
              <button className="workspace-primary-button workspace-details-ask" type="button" disabled={selected.status !== "Ready"} onClick={() => onAskDocument(selected)}>Ask about this</button>
            </div>
          ) : <p className="workspace-empty">Select a document to see its details.</p>}
        </aside>
      </section>
      {isLoading && <CircularLoader overlay label="Loading documents" />}
      {error && <p className="workspace-preview-note dashboard-error" role="alert">{error}</p>}
    </main>
  );
}
