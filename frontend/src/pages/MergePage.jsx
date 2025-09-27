import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import HelpCallout from '../components/HelpCallout.jsx';
import { getStorageCatalog, triggerMerge, publishMergedModel } from '../utils/api.js';
import { loadSettings, SETTINGS_EVENT } from '../utils/settings.js';

const defaultState = {
  base_model_name: 'Qwen/Qwen2.5-0.5B-Instruct',
  adapter_path: '',
  output_dir: 'merged_model/merged_latest',
  device: 'auto',
  trust_remote_code: true
};

const defaultPublishState = {
  repo_id: '',
  private: false,
  commit_message: 'Upload merged model'
};


export default function MergePage() {
  const [form, setForm] = useState(defaultState);
  const [jobId, setJobId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [publishForm, setPublishForm] = useState(defaultPublishState);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishJobId, setPublishJobId] = useState(null);
  const [publishMessage, setPublishMessage] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [settings, setSettings] = useState(() => loadSettings());
  const hasHfToken = Boolean(settings.huggingfaceToken);
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  useEffect(() => {
    getStorageCatalog()
      .then(data => {
        setCatalog(data);
        setCatalogError(null);
      })
      .catch(err => setCatalogError(err.message))
      .finally(() => setIsCatalogLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleUpdate = event => {
      setSettings(event.detail || loadSettings());
    };
    window.addEventListener(SETTINGS_EVENT, handleUpdate);
    return () => window.removeEventListener(SETTINGS_EVENT, handleUpdate);
  }, []);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePublishInputChange = event => {
    const { name, value, type, checked } = event.target;
    setPublishForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        setMessage('Merge job queued. Track status from the Activity tab.');
      })
      .catch(err => setError(err.message));
  };

  const handlePublish = () => {
    setPublishError(null);
    setPublishMessage(null);

    if (!form.output_dir || !form.output_dir.trim()) {
      setPublishError('Output directory is required before uploading.');
      return;
    }

    if (!publishForm.repo_id || !publishForm.repo_id.trim()) {
      setPublishError('Hugging Face repo ID is required.');
      return;
    }

    setIsPublishing(true);

    publishMergedModel({
      source_dir: form.output_dir,
      repo_id: publishForm.repo_id.trim(),
      token: settings.huggingfaceToken || undefined,
      private: publishForm.private,
      commit_message: publishForm.commit_message.trim() || undefined
    })
      .then(resp => {
        setPublishJobId(resp.job_id);
        setPublishMessage('Upload queued. Track status from the Activity tab.');
      })
      .catch(err => setPublishError(err.message))
      .finally(() => setIsPublishing(false));
  };

  const handleReset = () => {
    setForm(defaultState);
    setJobId(null);
    setMessage(null);
    setError(null);
    setPublishForm(defaultPublishState);
    setIsPublishing(false);
    setPublishJobId(null);
    setPublishMessage(null);
    setPublishError(null);
  };

  const adapterOptions = useMemo(() => {
    if (!catalog || !Array.isArray(catalog.merge)) {
      return [];
    }
    return catalog.merge.map(entry => ({
      value: entry.path,
      label: entry.label || entry.path
    }));
  }, [catalog]);

  useEffect(() => {
    if (!adapterOptions.length) {
      return;
    }
    setForm(prev => {
      if (adapterOptions.some(option => option.value === prev.adapter_path)) {
        return prev;
      }
      return { ...prev, adapter_path: adapterOptions[0].value };
    });
  }, [adapterOptions]);

  return (
    <div className="page page-merge">
      <PageHeader
        title="Publish a merged model"
        lead="Combine your base model and LoRA adapter into a single folder ready for inference or sharing."
        actions={
          <button type="button" className="secondary" onClick={handleReset}>
            Reset form
          </button>
        }
      />

      <HelpCallout title="When should I merge?">
        Merge once you are happy with evaluation results. The merged folder contains standard weights so downstream teams
        can run inference without LoRA-specific tooling.
      </HelpCallout>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: '1.4rem' }}>
        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="base_model_name">Base model</label>

            <input
              id="base_model_name"
              name="base_model_name"
              type="text"
              value={form.base_model_name}
              onChange={handleInputChange}
              required
            />
            <small>Should match the model you fine-tuned.</small>
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
            <small>Leave on auto to let the backend choose GPU/CPU.</small>
          </div>
        </div>

        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="adapter_path">Adapter path</label>
            <select
              id="adapter_path"
              name="adapter_path"
              value={form.adapter_path}
              onChange={handleInputChange}
              disabled={isCatalogLoading || !adapterOptions.length}
              required
            >
              <option value="" disabled>
                {isCatalogLoading ? 'Loading adapters…' : 'Select an adapter'}
              </option>
              {adapterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>Choose from saved adapters ready for merging.</small>
            {catalogError && <small style={{ color: 'crimson' }}>{catalogError}</small>}
          </div>
          <div className="field" style={{ alignItems: 'center' }}>
            <label htmlFor="trust_remote_code">Trust remote code</label>
            <input
              id="trust_remote_code"
              name="trust_remote_code"
              type="checkbox"
              checked={form.trust_remote_code}
              onChange={handleInputChange}
            />
            <small>Required for some base models that register custom layers.</small>
          </div>
        </div>

        <div className="field">
          <label htmlFor="output_dir">Output directory</label>
          <input
            id="output_dir"
            name="output_dir"
            type="text"
            value={form.output_dir}
            onChange={handleInputChange}
            required
          />
          <small>The merged folder will be created here.</small>
        </div>

        <div className="button-row">
          <button type="submit" className="primary">Start merge</button>
          {jobId && <span className="pill">Job queued · ID {jobId}</span>}
        </div>

        {message && <p style={{ color: '#065f46', margin: 0 }}>{message}</p>}
        {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
      </form>

      <div className="card">
        <h2 className="card-title">Upload to Hugging Face Hub</h2>
        <p className="muted-text" style={{ marginBottom: '0.75rem' }}>
          Once the merge is finished, push the merged directory straight to your Hugging Face account.
        </p>

        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="hub_repo_id">Repository ID</label>
            <input
              id="hub_repo_id"
              name="repo_id"
              type="text"
              value={publishForm.repo_id}
              onChange={handlePublishInputChange}
              placeholder="username/model-name"
              required
            />
            <small>Format: namespace/model-name.</small>
          </div>
          <div className="field">
            <label htmlFor="hub_commit_message">Commit message</label>
            <input
              id="hub_commit_message"
              name="commit_message"
              type="text"
              value={publishForm.commit_message}
              onChange={handlePublishInputChange}
            />
          </div>
        </div>

        <div className="grid two-columns">
          <div className="field" style={{ alignItems: 'center' }}>
            <label htmlFor="hub_private">Private repository</label>
            <input
              id="hub_private"
              name="private"
              type="checkbox"
              checked={publishForm.private}
              onChange={handlePublishInputChange}
            />
            <small>Enable to keep the repository private.</small>
          </div>
          <div className="field">
            <label>Hugging Face token</label>
            <div className="muted-text" style={{ margin: 0 }}>
              Settings token: {hasHfToken ? 'configured' : 'not set'}.
            </div>
            <small>Update tokens from the Settings page. They are attached automatically when present.</small>
          </div>
        </div>

        <div className="button-row">
          <button type="button" className="primary" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? 'Uploading...' : 'Upload to Hugging Face'}
          </button>
          {publishJobId && <span className="pill">Upload queued · ID {publishJobId}</span>}
        </div>

        {publishMessage && <p style={{ color: '#0369a1', margin: 0 }}>{publishMessage}</p>}
        {publishError && <p style={{ color: 'crimson', margin: 0 }}>{publishError}</p>}
      </div>
    </div>
  );
}
