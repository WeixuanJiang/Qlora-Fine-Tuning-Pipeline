import { useEffect, useState } from 'react';
import { listAdapters, triggerMerge } from '../utils/api.js';

const defaultState = {
  base_model_name: 'Qwen/Qwen2.5-0.5B-Instruct',
  adapter_path: '',
  output_dir: 'merged_model/merged_latest',
  device: 'auto',
  trust_remote_code: true
};

export default function MergePage() {
  const [form, setForm] = useState(defaultState);
  const [adapters, setAdapters] = useState([]);
  const [selectedAdapter, setSelectedAdapter] = useState('');
  const [jobId, setJobId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listAdapters()
      .then(data => setAdapters(data.adapters || []))
      .catch(err => setError(err.message));
  }, []);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAdapterSelect = event => {
    const value = event.target.value;
    setSelectedAdapter(value);
    setForm(prev => ({ ...prev, adapter_path: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.adapter_path) {
      setError('Adapter path is required.');
      return;
    }

    triggerMerge({
      base_model_name: form.base_model_name,
      adapter_path: form.adapter_path,
      output_dir: form.output_dir,
      device: form.device,
      trust_remote_code: form.trust_remote_code
    })
      .then(resp => {
        setJobId(resp.job_id);
        setMessage('Merge job queued. Monitor progress on Jobs page.');
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Merge LoRA Adapter</h2>
      <form onSubmit={handleSubmit} className="grid">
        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="base_model_name">Base Model</label>
            <input
              id="base_model_name"
              name="base_model_name"
              type="text"
              value={form.base_model_name}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
            />
          </div>
          <div className="field">
            <label htmlFor="output_dir">Output Directory</label>
            <input
              id="output_dir"
              name="output_dir"
              type="text"
              value={form.output_dir}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="field" style={{ alignItems: 'center', marginTop: '1.9rem' }}>
            <label htmlFor="trust_remote_code" style={{ fontWeight: 600 }}>Trust Remote Code</label>
            <input
              id="trust_remote_code"
              name="trust_remote_code"
              type="checkbox"
              checked={form.trust_remote_code}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="adapter_select">Registered Adapters</label>
          <select id="adapter_select" value={selectedAdapter} onChange={handleAdapterSelect}>
            <option value="">-- Choose adapter --</option>
            {adapters.map((adapter, idx) => (
              <option key={`${adapter.path}-${idx}`} value={adapter.path}>
                {adapter.name || 'adapter'} — {adapter.path}
              </option>
            ))}
          </select>
          <small style={{ color: '#6b7280' }}>Select an adapter from registry or provide a custom path below.</small>
        </div>

        <div className="field">
          <label htmlFor="adapter_path">Adapter Path</label>
          <input
            id="adapter_path"
            name="adapter_path"
            type="text"
            value={form.adapter_path}
            onChange={handleInputChange}
            placeholder="models/run_YYYY-MM-DD_HHMM"
            required
          />
        </div>

        <button type="submit" className="primary">Start Merge</button>
      </form>
      {message && <p style={{ color: '#065f46' }}>{message}</p>}
      {jobId && <p>Job ID: <code>{jobId}</code></p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}
