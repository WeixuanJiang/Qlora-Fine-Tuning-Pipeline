const resolveDefaultApiUrl = () => {
  let apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl || !apiUrl.trim()) {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname || 'localhost';
      return `${window.location.protocol}//${host}:8000`;
    }
    return 'http://localhost:8000';
  }

  if (typeof window !== 'undefined' && apiUrl.includes('backend')) {
    const host = window.location.hostname || 'localhost';
    return apiUrl.replace('backend', host);
  }

  return apiUrl;
};

const API_BASE_URL = resolveDefaultApiUrl();

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export function getTrainParameters() {
  return fetch(`${API_BASE_URL}/train/parameters`).then(handleResponse);
}

export function triggerTraining(parameters) {
  return fetch(`${API_BASE_URL}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parameters })
  }).then(handleResponse);
}

export function triggerEvaluation(payload) {
  return fetch(`${API_BASE_URL}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse);
}

export function triggerMerge(payload) {
  return fetch(`${API_BASE_URL}/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse);
}

export function publishMergedModel(payload) {
  return fetch(`${API_BASE_URL}/publish/hub`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse);
}

export async function generateText(payload, options = {}) {
  const { retries = 1, backoffMs = 600 } = options;
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await handleResponse(response);
    } catch (err) {
      attempt += 1;
      if (attempt > retries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
    }
  }
}

export function listJobs() {
  return fetch(`${API_BASE_URL}/jobs`).then(handleResponse);
}

export function getJob(jobId) {
  return fetch(`${API_BASE_URL}/jobs/${jobId}`).then(handleResponse);
}

export function listAdapters() {
  return fetch(`${API_BASE_URL}/adapters`).then(handleResponse);
}

export function getStorageCatalog() {
  return fetch(`${API_BASE_URL}/storage/catalog`).then(handleResponse);
}

export function getEvaluationResults(path) {
  const url = new URL(`${API_BASE_URL}/evaluation/results`);
  if (path && path.trim()) {
    url.searchParams.set('path', path.trim());
  }
  return fetch(url).then(handleResponse);
}

export function deleteAdapter(path, removeFiles = false) {
  return fetch(`${API_BASE_URL}/adapters`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, remove_files: removeFiles })
  }).then(handleResponse);
}

export function getJobLogs(jobId, since = 0) {
  const url = new URL(`${API_BASE_URL}/jobs/${jobId}/logs`);
  if (since > 0) {
    url.searchParams.set('since', String(since));
  }
  return fetch(url).then(handleResponse);
}

export { API_BASE_URL };
