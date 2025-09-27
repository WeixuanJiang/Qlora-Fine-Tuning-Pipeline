import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import HelpCallout from '../components/HelpCallout.jsx';
import { clearSettings, loadSettings, saveSettings, SETTINGS_EVENT } from '../utils/settings.js';

const maskToken = token => {
  if (!token) return 'Not set';
  if (token.length <= 6) return `${token.slice(0, 2)}…`;
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
};

export default function SettingsPage() {
  const [form, setForm] = useState(() => loadSettings());
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleUpdate = event => {
      setForm(event.detail || loadSettings());
    };
    window.addEventListener(SETTINGS_EVENT, handleUpdate);
    return () => window.removeEventListener(SETTINGS_EVENT, handleUpdate);
  }, []);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    const next = saveSettings({
      huggingfaceToken: form.huggingfaceToken.trim(),
      openaiApiKey: form.openaiApiKey.trim()
    });
    setForm(next);
    setStatus('Settings saved. Tokens are stored locally in this browser.');
  };

  const handleClear = () => {
    const cleared = clearSettings();
    setForm(cleared);
    setStatus('All stored tokens cleared.');
  };

  const hasHfToken = useMemo(() => Boolean(form.huggingfaceToken), [form.huggingfaceToken]);
  const hasOpenAiKey = useMemo(() => Boolean(form.openaiApiKey), [form.openaiApiKey]);

  return (
    <div className="page page-settings">
      <PageHeader
        title="Workspace settings"
        lead="Store credentials locally so publish and evaluation workflows can use them automatically."
        actions={
          <button type="button" className="secondary" onClick={handleClear}>
            Clear tokens
          </button>
        }
      />

      <HelpCallout title="Where are the keys stored?">
        Tokens are saved in your browser's local storage. They are never sent anywhere except when required by a job
        (for example uploading to Hugging Face or calling OpenAI). Update or clear them any time.
      </HelpCallout>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: '1.6rem' }}>
        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="huggingfaceToken">Hugging Face access token</label>
            <input
              id="huggingfaceToken"
              name="huggingfaceToken"
              type="password"
              value={form.huggingfaceToken}
              onChange={handleChange}
              placeholder="hf_xxx..."
              autoComplete="off"
            />
            <small>
              Required for private repositories. Currently: {hasHfToken ? `token set (${maskToken(form.huggingfaceToken)})` : 'not set'}.
            </small>
          </div>
          <div className="field">
            <label htmlFor="openaiApiKey">OpenAI API key</label>
            <input
              id="openaiApiKey"
              name="openaiApiKey"
              type="password"
              value={form.openaiApiKey}
              onChange={handleChange}
              placeholder="sk-..."
              autoComplete="off"
            />
            <small>
              Used when you select an evaluator model (e.g. GPT-4o). Currently: {hasOpenAiKey ? `key set (${maskToken(form.openaiApiKey)})` : 'not set'}.
            </small>
          </div>
        </div>

        <div className="button-row">
          <button type="submit" className="primary">Save settings</button>
        </div>

        {status && <p style={{ color: '#0369a1', margin: 0 }}>{status}</p>}
      </form>
    </div>
  );
}
