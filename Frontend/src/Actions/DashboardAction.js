import { apiRequest } from './api';

export const WORKSPACE_DOCUMENTS_CACHE_KEY = "workspace-documents";

const getDocumentRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.documents)) return response.documents;
  if (Array.isArray(response?.data?.documents)) return response.data.documents;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const uploadDocument = async (title, file) => {
  const formData = new FormData();
  formData.append('title', title.trim());
  formData.append('file', file);

  return apiRequest('/api/documents', {
    method: 'POST',
    body: formData,
  });
};

export const listDocuments = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/api/documents${query ? `?${query}` : ''}`;
  return apiRequest(endpoint);
};

export const listWorkspaceDocuments = async (params = { page: 1, limit: 100 }) => {
  const response = await listDocuments(params);
  const documents = getDocumentRows(response);

  return {
    ...(response && typeof response === "object" && !Array.isArray(response) ? response : {}),
    documents,
    total: response?.total ?? response?.data?.total ?? documents.length,
  };
};

export const deleteDocument = (documentId) =>
  apiRequest(`/api/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' });

export const getDocumentDetails = (documentId) =>
  apiRequest(`/api/documents/${encodeURIComponent(documentId)}`);

export const deleteAllDocuments = async () => apiRequest('/api/documents', { method: 'DELETE' });

export const getRawDocument = async (documentId) => {
  return apiRequest(`/api/documents/${encodeURIComponent(documentId)}/raw`, { responseType: 'blob' });
};

export const updateDocument = (documentId, updateData) =>
  apiRequest(`/api/documents/${encodeURIComponent(documentId)}`, {
    method: 'PATCH',
    body: updateData,
  });
