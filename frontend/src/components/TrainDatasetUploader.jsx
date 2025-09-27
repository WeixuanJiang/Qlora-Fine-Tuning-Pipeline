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
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      <label style={{ fontWeight: 600 }} htmlFor="dataset-upload">
        Upload dataset file
      </label>
      <input
        id="dataset-upload"
        type="file"
        accept=".json,.jsonl,.txt"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <span className="helper-text">Supports JSON, JSONL or TXT. Files are saved inside the data/ directory.</span>
      {isUploading && <p style={{ color: '#1d4ed8', margin: 0 }}>Uploading…</p>}
      {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
    </div>
  );
}
