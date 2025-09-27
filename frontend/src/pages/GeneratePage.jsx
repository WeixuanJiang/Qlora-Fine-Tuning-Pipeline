import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import HelpCallout from '../components/HelpCallout.jsx';
import ModelSelect from '../components/ModelSelect.jsx';
import { deleteAdapter, generateText, listAdapters, getStorageCatalog } from '../utils/api.js';

const defaultState = {
  model_path: './merged_model',
  max_new_tokens: 256,
  temperature: 0.7,
  top_p: 0.9,
  top_k: 50,
  num_beams: 1,
  device: 'auto',
  trust_remote_code: true
};

const createMessage = (role, content) => ({
  id:
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  timestamp: new Date().toISOString()
});

const initialMessages = [
  createMessage('assistant', 'Welcome! Ask a question and I will answer using your fine-tuned model.')
];

const buildPrompt = conversation => {
  const lines = conversation.map(message => {
    const speaker = message.role === 'user' ? 'User' : 'Assistant';
    return `${speaker}: ${message.content}`;
  });
  const prompt = lines.join('\n');
  return `${prompt}\nAssistant:`;
};


const formatTimestamp = iso => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function GeneratePage() {
  const [form, setForm] = useState(defaultState);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [adapterOptions, setAdapterOptions] = useState([]);
  const [adaptersError, setAdaptersError] = useState(null);
  const [removingPath, setRemovingPath] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const historyRef = useRef(null);

  const refreshAdapters = useCallback(() => {
    listAdapters()
      .then(data => {
        setAdapterOptions(data.adapters || []);
        setAdaptersError(null);
      })
      .catch(err => setAdaptersError(err.message));
  }, []);

  const loadCatalog = useCallback(() => {
    setIsCatalogLoading(true);
    getStorageCatalog()
      .then(data => {
        setCatalog(data);
        setCatalogError(null);
      })
      .catch(err => setCatalogError(err.message))
      .finally(() => setIsCatalogLoading(false));
  }, []);

  useEffect(() => {
    refreshAdapters();
  }, [refreshAdapters]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const historyEl = historyRef.current;
    if (!historyEl) return;
    historyEl.scrollTop = historyEl.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setShowSettings(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleSettingChange = event => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const submitMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('Please enter a message.');
      return;
    }

    const userMessage = createMessage('user', trimmed);
    const nextConversation = [...messages, userMessage];

    setMessages(nextConversation);
    setDraft('');
    setError(null);
    setLoading(true);

    const payload = {
      ...form,
      prompt: buildPrompt(nextConversation),
      max_new_tokens: Number(form.max_new_tokens),
      temperature: Number(form.temperature),
      top_p: Number(form.top_p),
      top_k: Number(form.top_k),
      num_beams: Number(form.num_beams)
    };

    generateText(payload, { retries: 2 })
      .then(data => {
        const reply = (data.response || '').trim() || '🤔 No response returned.';
        setMessages(prev => [...prev, createMessage('assistant', reply)]);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleSend = event => {
    event.preventDefault();
    if (!loading) {
      submitMessage();
    }
  };

  const handleInputKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!loading) {
        submitMessage();
      }
    }
  };

  const handleResetConversation = () => {
    setMessages(initialMessages);
    setDraft('');
    setError(null);
    setLoading(false);
  };

  const handleResetSettings = () => {
    setForm(defaultState);
    setShowAdvanced(false);
  };

  const handleModelSelect = newPath => {
    setForm(prev => ({ ...prev, model_path: newPath }));
  };

  const handleRemoveAdapter = async path => {
    if (!path) return;
    const confirmRemove = window.confirm(
      'Remove this adapter from the registry? This action cannot be undone.'
    );
    if (!confirmRemove) return;

    const removeFiles = window.confirm('Also delete the adapter files from disk?');

    setRemovingPath(path);
    try {
      await deleteAdapter(path, removeFiles);
      setAdapterOptions(prev => prev.filter(adapter => adapter.path !== path));
      loadCatalog();
      if (form.model_path === path) {
        setForm(prev => ({ ...prev, model_path: './merged_model' }));
      }
      setAdaptersError(null);
    } catch (err) {
      setAdaptersError(err.message);
    } finally {
      setRemovingPath(null);
    }
  };

  const handleCopyMessage = async message => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      setError(err.message || 'Failed to copy message.');
    }
  };

  const modelOptions = useMemo(() => {
    const optionMap = new Map();

    const addOption = (value, label) => {
      const trimmed = (value || '').trim();
      if (!trimmed || optionMap.has(trimmed)) {
        return;
      }
      optionMap.set(trimmed, {
        value: trimmed,
        label: label && label.trim() ? label : trimmed
      });
    };

    if (catalog && Array.isArray(catalog.models)) {
      catalog.models.forEach(entry => {
        addOption(entry.path, entry.label);
      });
    }

    adapterOptions.forEach(adapter => {
      if (!adapter || !adapter.path) {
        return;
      }
      const labelParts = [];
      if (adapter.name) {
        labelParts.push(adapter.name);
      }
      if (adapter.training_date) {
        labelParts.push(`(${adapter.training_date})`);
      }
      labelParts.push(adapter.path);
      addOption(adapter.path, labelParts.join(' '));
    });

    if (form.model_path && !optionMap.has(form.model_path)) {
      addOption(form.model_path, `${form.model_path} (current)`);
    }

    if (!optionMap.size) {
      addOption('./merged_model', './merged_model');
    }

    return Array.from(optionMap.values());
  }, [adapterOptions, catalog, form.model_path]);

  useEffect(() => {
    if (!modelOptions.length) {
      return;
    }
    setForm(prev => {
      if (modelOptions.some(option => option.value === prev.model_path)) {
        return prev;
      }
      return { ...prev, model_path: modelOptions[0].value };
    });
  }, [modelOptions]);

  const renderAdvancedControls = () => (
    <div className="grid two-columns" style={{ marginTop: '1rem' }}>
      <div className="field">
        <label htmlFor="top_p">Top-p nucleus sampling</label>
        <input
          id="top_p"
          name="top_p"
          type="number"
          min={0}
          max={1}
          step="0.05"
          value={form.top_p}
          onChange={handleSettingChange}
        />
      </div>
      <div className="field">
        <label htmlFor="top_k">Top-k sampling</label>
        <input
          id="top_k"
          name="top_k"
          type="number"
          min={1}
          value={form.top_k}
          onChange={handleSettingChange}
        />
      </div>
      <div className="field">
        <label htmlFor="num_beams">Number of beams</label>
        <input
          id="num_beams"
          name="num_beams"
          type="number"
          min={1}
          value={form.num_beams}
          onChange={handleSettingChange}
        />
        <small>Beam search explores multiple answer drafts. Keep at 1 for faster responses.</small>
      </div>
      <div className="field">
        <label htmlFor="device">Device override</label>
        <input
          id="device"
          name="device"
          type="text"
          value={form.device}
          onChange={handleSettingChange}
          placeholder="auto"
        />
        <small>Leave on auto to let the backend decide (GPU if available).</small>
      </div>
      <div className="field" style={{ alignItems: 'center' }}>
        <label htmlFor="trust_remote_code">Trust remote code</label>
        <input
          id="trust_remote_code"
          name="trust_remote_code"
          type="checkbox"
          checked={Boolean(form.trust_remote_code)}
          onChange={handleSettingChange}
        />
        <small>Required when the model repo ships custom generation code.</small>
      </div>
    </div>
  );

  return (
    <div className="page page-generate">
      <PageHeader
        title="Chat with your tuned model"
        lead="Have a real conversation with your fine-tuned model, monitor responses, and tweak decoding controls on the fly."
      />

      <HelpCallout title="Tip for richer chats">
        Use the first turn to set persona or guardrails for the model. The conversation history is included with every
        subsequent prompt so the instructions stay active.
      </HelpCallout>

      <div className={`chat-shell${showSettings ? ' settings-open' : ''}`}>
        <section className="card chat-window" aria-label="Conversation window">
          <header className="chat-toolbar">
            <div className="chat-toolbar-info">
              <span className="chat-model-label">Active model</span>
              <span className="chat-model-name">{form.model_path || 'No model selected'}</span>
            </div>
            <div className="chat-toolbar-actions">
              <button type="button" className="ghost-button" onClick={handleResetConversation}>
                Clear chat
              </button>
              <button type="button" className="ghost-button" onClick={handleResetSettings}>
                Reset sampling
              </button>
              <button
                type="button"
                className="ghost-button toggle"
                onClick={() => setShowSettings(prev => !prev)}
                aria-pressed={showSettings}
              >
                {showSettings ? 'Hide settings' : 'Show settings'}
              </button>
            </div>
          </header>

          <div className="chat-scroll" ref={historyRef} role="log" aria-live="polite">
            {messages.map(message => (
              <article key={message.id} className={`chat-message ${message.role}`}>
                <div className="chat-avatar" aria-hidden="true">
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className="chat-bubble">
                  <div className="chat-message-meta">
                    <span className="chat-speaker">{message.role === 'user' ? 'You' : 'Assistant'}</span>
                    <span>{formatTimestamp(message.timestamp)}</span>
                    {message.role === 'assistant' && (
                      <button
                        type="button"
                        className="copy-button"
                        onClick={() => handleCopyMessage(message)}
                        aria-label="Copy response"
                      >
                        {copiedMessageId === message.id ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <p>{message.content}</p>
                </div>
              </article>
            ))}
            {loading && (
              <div className="chat-message assistant typing">
                <div className="chat-avatar" aria-hidden="true">AI</div>
                <div className="chat-bubble">Thinking…</div>
              </div>
            )}
          </div>

          {error && <p className="chat-error" role="alert">{error}</p>}

          <form className="chat-composer" onSubmit={handleSend}>
            <label htmlFor="chat-draft" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-draft"
              name="chat-draft"
              placeholder="Ask a question, provide instructions, or paste a prompt"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={loading}
              rows={3}
            />
            <div className="chat-composer-actions">
              <small className="muted-text">Press Shift + Enter for a new line</small>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Generating…' : 'Send'}
              </button>
            </div>
          </form>
        </section>

        <aside className={`card chat-sidebar${showSettings ? ' open' : ''}`} aria-label="Generation settings">
          <div className="chat-sidebar-header">
            <h2 className="card-title">Model settings</h2>
            <button type="button" className="ghost-button" onClick={() => setShowSettings(false)}>
              Close
            </button>
          </div>
          <p className="muted-text">
            Settings apply to every turn. Adjust them before sending the next message for a different style of answer.
          </p>

          <ModelSelect
            value={form.model_path}
            onChange={handleModelSelect}
            options={modelOptions}
            label="Model folder"
            placeholder={isCatalogLoading ? 'Loading models…' : 'Choose a fine-tuned model'}
            help={catalogError ? `Unable to refresh model list: ${catalogError}` : 'Pick from registered adapters or merged outputs.'}
            disabled={isCatalogLoading || !modelOptions.length}
          />
          {adaptersError && <p style={{ color: 'crimson', margin: 0 }}>{adaptersError}</p>}

          {adapterOptions.length > 0 && (
            <div className="adapter-manager">
              <p className="muted-text" style={{ margin: 0 }}>Manage adapters</p>
              <ul className="adapter-list">
                {adapterOptions.map(adapter => (
                  <li key={adapter.path}>
                    <div>
                      <strong>{adapter.name || 'Adapter'}</strong>
                      <span className="muted-text">{adapter.path}</span>
                    </div>
                    <button
                      type="button"
                      className="danger-link"
                      onClick={() => handleRemoveAdapter(adapter.path)}
                      disabled={removingPath === adapter.path}
                    >
                      {removingPath === adapter.path ? 'Removing…' : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="field">
            <label htmlFor="temperature">Temperature</label>
            <input
              id="temperature"
              name="temperature"
              type="number"
              min={0}
              max={2}
              step="0.05"
              value={form.temperature}
              onChange={handleSettingChange}
            />
            <small>Lower values = focused answers, higher values = creative exploration.</small>
          </div>

          <div className="field">
            <label htmlFor="max_new_tokens">Max new tokens</label>
            <input
              id="max_new_tokens"
              name="max_new_tokens"
              type="number"
              min={16}
              max={2048}
              value={form.max_new_tokens}
              onChange={handleSettingChange}
            />
            <small>Caps the length of each reply.</small>
          </div>

          <div className="field" style={{ marginTop: '1.2rem' }}>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setShowAdvanced(prev => !prev)}
              aria-expanded={showAdvanced}
            >
              {showAdvanced ? 'Hide advanced sampling' : 'Show advanced sampling'}
            </button>
          </div>

          {showAdvanced && renderAdvancedControls()}
        </aside>
        {showSettings && <div className="settings-backdrop" onClick={() => setShowSettings(false)} />}
      </div>
    </div>
  );
}
