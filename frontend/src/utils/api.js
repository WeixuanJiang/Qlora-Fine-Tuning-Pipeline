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

export function generateText(payload) {
  return fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse);
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

export { API_BASE_URL };
