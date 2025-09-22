import { useState } from 'react';
import { API_BASE_URL } from '../utils/api.js';

export default function TrainDatasetUploader({ onUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('destination', 'data');

    setIsUploading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }
      const payload = await response.json();
      onUploaded?.(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Upload dataset file</label>
      <input type="file" accept=".json,.jsonl,.txt" onChange={handleFileChange} disabled={isUploading} />
      {isUploading && <p style={{ color: '#1d4ed8' }}>Uploading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}
