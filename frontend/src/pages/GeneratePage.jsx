import { useState } from 'react';
import { generateText } from '../utils/api.js';

const defaultState = {
  model_path: './merged_model',
  prompt: '',
  max_new_tokens: 256,
  temperature: 0.7,
  top_p: 0.9,
  top_k: 50,
  num_beams: 1,
  device: 'auto',
  trust_remote_code: true
};

export default function GeneratePage() {
  const [form, setForm] = useState(defaultState);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = event => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResponse('');

    const payload = {
      ...form,
      max_new_tokens: Number(form.max_new_tokens),
      temperature: Number(form.temperature),
      top_p: Number(form.top_p),
      top_k: Number(form.top_k),
      num_beams: Number(form.num_beams)
    };

    generateText(payload)
      .then(data => setResponse(data.response || ''))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Generate Text</h2>
      <form onSubmit={handleSubmit} className="grid">
        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="model_path">Model Path</label>
            <input
              id="model_path"
              name="model_path"
              type="text"
              value={form.model_path}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="device">Device</label>
            <input
              id="device"
              name="device"
              type="text"
              value={form.device}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="max_new_tokens">Max New Tokens</label>
            <input
              id="max_new_tokens"
              name="max_new_tokens"
              type="number"
              min={1}
              value={form.max_new_tokens}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="temperature">Temperature</label>
            <input
              id="temperature"
              name="temperature"
              type="number"
              step="0.05"
              value={form.temperature}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="top_p">Top P</label>
            <input
              id="top_p"
              name="top_p"
              type="number"
              step="0.05"
              value={form.top_p}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="top_k">Top K</label>
            <input
              id="top_k"
              name="top_k"
              type="number"
              value={form.top_k}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="num_beams">Num Beams</label>
            <input
              id="num_beams"
              name="num_beams"
              type="number"
              value={form.num_beams}
              onChange={handleChange}
            />
          </div>
          <div className="field" style={{ alignItems: 'center', marginTop: '1.9rem' }}>
            <label htmlFor="trust_remote_code" style={{ fontWeight: 600 }}>Trust Remote Code</label>
            <input
              id="trust_remote_code"
              name="trust_remote_code"
              type="checkbox"
              checked={form.trust_remote_code}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            name="prompt"
            value={form.prompt}
            onChange={handleChange}
            placeholder="Enter your prompt here"
            required
          />
        </div>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {response && (
        <div className="card" style={{ background: '#f8fafc' }}>
          <h3>Model Response</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{response}</pre>
        </div>
      )}
    </div>
  );
}
