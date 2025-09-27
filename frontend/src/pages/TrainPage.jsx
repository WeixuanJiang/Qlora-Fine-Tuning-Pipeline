import { useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import HelpCallout from '../components/HelpCallout.jsx';
import { getJob, getJobLogs, getTrainParameters, triggerTraining } from '../utils/api.js';
import TrainDatasetUploader from '../components/TrainDatasetUploader.jsx';

const ESSENTIAL_FIELD_ORDER = [
  'model_name',
  'dataset_path',
  'dataset_name',
  'output_dir',
  'input_column',
  'target_column',
  'num_train_epochs',
  'per_device_train_batch_size',
  'learning_rate',
  'gradient_accumulation_steps'
];

const ADVANCED_INFO = {
  Dataset:
    'Control how the dataset is trimmed or sampled. Useful when you have very long prompts or limited GPU memory.',
  Training:
    'Shape how long training lasts and how the optimizer behaves. The defaults work for most small datasets.',
  LoRA:
    'Tune adapter-specific knobs. Leave the defaults unless you know a different rank/alpha is required.',
  Quantization:
    'Memory-saving options for large base models. Double check device support before changing.',
  Prompt:
    'Inject a custom formatting template or prompt style to better match your data.',
  'Model Saving':
    'Decide where checkpoints go and whether to upload to the Hugging Face Hub.',
  Tracking:
    'Add experiment tracking labels or connect to services such as TensorBoard.',
  Misc: 'Utility toggles for logging cadence and reproducibility.'
};

const normalizeDefault = spec => {
  const value = spec.default;
  switch (spec.type) {
    case 'boolean':
      return value ?? false;
    case 'number':
      return value ?? '';
    case 'list':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value ?? '';
    case 'json':
      return value ? JSON.stringify(value, null, 2) : '';
    default:
      return value ?? '';
  }
};

const formatDefaultValue = spec => {
  if (spec.default === undefined || spec.default === null) {
    return null;
  }
  if (spec.type === 'boolean') {
    return spec.default ? 'Enabled' : 'Disabled';
  }
  if (Array.isArray(spec.default)) {
    return spec.default.join(', ');
  }
  if (typeof spec.default === 'object') {
    try {
      return JSON.stringify(spec.default);
    } catch (err) {
      return String(spec.default);
    }
  }
  return String(spec.default);
};

const parseValue = (spec, raw) => {
  if (raw === '' || raw === null || raw === undefined) {
    return undefined;
  }
  switch (spec.type) {
    case 'boolean':
      return raw === true || raw === 'true';
    case 'number': {
      if (spec.subtype === 'int') {
        const intVal = parseInt(raw, 10);
        return Number.isNaN(intVal) ? undefined : intVal;
      }
      const floatVal = parseFloat(raw);
      return Number.isNaN(floatVal) ? undefined : floatVal;
    }
    case 'list':
      if (Array.isArray(raw)) return raw;
      return raw
        .split(/[\,\n]/)
        .map(item => item.trim())
        .filter(Boolean);
    case 'json':
      if (typeof raw === 'object') return raw;
      return JSON.parse(raw);
    default:
      return raw;
  }
};


const createRunLabel = (modelName, datasetRef) => {
  const baseCandidate = (datasetRef && datasetRef.trim()) || (modelName && modelName.split('/').pop()) || 'run';
  const safeBase = (baseCandidate || 'run').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'run';
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `${safeBase}-${stamp}`;
};
export default function TrainPage() {
  const [specs, setSpecs] = useState([]);
  const [values, setValues] = useState({});
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobStatus, setJobStatus] = useState(null);
  const [logLines, setLogLines] = useState([]);
  const [logError, setLogError] = useState(null);
  const [isStreamingLogs, setIsStreamingLogs] = useState(false);
  const [runLabel, setRunLabel] = useState('');
  const [runLabelTouched, setRunLabelTouched] = useState(false);
  const logOffsetRef = useRef(0);
  const logContainerRef = useRef(null);

  useEffect(() => {
    getTrainParameters()
      .then(data => {
        const paramSpecs = data.parameters || [];
        setSpecs(paramSpecs);
        const defaultsObj = {};
        paramSpecs.forEach(spec => {
          defaultsObj[spec.name] = normalizeDefault(spec);
        });
        setDefaults(defaultsObj);
        setValues(defaultsObj);
        setRunLabel(createRunLabel(defaultsObj.model_name, defaultsObj.dataset_name || defaultsObj.dataset_path));
        setRunLabelTouched(false);
      })
      .catch(err => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const essentialSpecs = useMemo(() => {
    if (!specs.length) return [];
    const essentials = ESSENTIAL_FIELD_ORDER.map(name => specs.find(spec => spec.name === name)).filter(Boolean);
    const seen = new Set(essentials.map(spec => spec.name));
    specs.forEach(spec => {
      if (!seen.has(spec.name) && spec.category === 'General' && essentials.length < 8) {
        essentials.push(spec);
      }
    });
    return essentials;
  }, [specs]);

  const advancedGroups = useMemo(() => {
    const groups = {};
    const term = searchTerm.trim().toLowerCase();
    specs.forEach(spec => {
      if (ESSENTIAL_FIELD_ORDER.includes(spec.name)) {
        return;
      }
      const category = spec.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      const haystack = `${spec.label || ''} ${spec.name}`.toLowerCase();
      if (term && !haystack.includes(term)) {
        return;
      }
      groups[category].push(spec);
    });
    return Object.entries(groups)
      .filter(([, fields]) => fields.length > 0)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [specs, searchTerm]);

  const handleInputChange = (spec, event) => {
    if (spec.type === 'boolean') {
      setValues(prev => ({ ...prev, [spec.name]: event.target.checked }));
      return;
    }

    const newValue = event.target.value;
    setValues(prev => {
      const next = { ...prev, [spec.name]: newValue };
      if (!runLabelTouched && ['model_name', 'dataset_name', 'dataset_path'].includes(spec.name)) {
        const modelRef = spec.name === 'model_name' ? newValue : next.model_name;
        const datasetRef =
          spec.name === 'dataset_name'
            ? newValue
            : spec.name === 'dataset_path'
            ? newValue
            : next.dataset_name || next.dataset_path;
        setRunLabel(createRunLabel(modelRef, datasetRef));
      }
      return next;
    });
  };

  const handleRunLabelChange = event => {
    setRunLabel(event.target.value);
    setRunLabelTouched(true);
  };

  const handleDatasetUploaded = payload => {
    if (payload?.path) {
      setValues(prev => {
        const next = { ...prev, dataset_path: payload.path };
        if (!runLabelTouched) {
          setRunLabel(createRunLabel(next.model_name, next.dataset_name || payload.path));
        }
        return next;
      });
      setSuccessMsg(`Uploaded dataset saved to ${payload.path}`);
    }
  };

  const handleReset = () => {
    setValues(defaults);
    setSuccessMsg(null);
    setFormError(null);
    setJobId(null);
    setJobStatus(null);
    setLogLines([]);
    setLogError(null);
    setIsStreamingLogs(false);
    const nextLabel = createRunLabel(defaults.model_name, defaults.dataset_name || defaults.dataset_path);
    setRunLabel(nextLabel);
    setRunLabelTouched(false);
  };

  const handleSubmit = event => {
    event.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    setLogError(null);

    try {
      const payload = {};
      specs.forEach(spec => {
        const raw = values[spec.name];
        const parsed = parseValue(spec, raw);
        if (parsed !== undefined && parsed !== '') {
          payload[spec.name] = parsed;
        }
      });

      let effectiveRunName = runLabel.trim();
      if (!effectiveRunName) {
        effectiveRunName = createRunLabel(values.model_name, values.dataset_name || values.dataset_path);
        setRunLabel(effectiveRunName);
      }
      payload.run_name = effectiveRunName;
      if (payload.register_adapter !== false && !payload.adapter_name) {
        payload.adapter_name = effectiveRunName;
      }

      triggerTraining(payload)
        .then(resp => {
          setJobId(resp.job_id);
          setSuccessMsg(`Training job queued: ${effectiveRunName}`);
          setJobStatus('queued');
          setLogLines([]);
          setIsStreamingLogs(true);
          logOffsetRef.current = 0;
        })
        .catch(err => setFormError(err.message));
    } catch (err) {
      setFormError(err.message);
    }
  };

  useEffect(() => {
    if (!jobId) {
      setIsStreamingLogs(false);
      return;
    }

    let cancelled = false;
    let timeoutId = null;
    let idleRuns = 0;

    setLogLines([]);
    setLogError(null);
    logOffsetRef.current = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const [logsResp, jobResp] = await Promise.all([
          getJobLogs(jobId, logOffsetRef.current),
          getJob(jobId)
        ]);

        if (cancelled) return;

        if (logsResp?.reset) {
          setLogLines(logsResp.logs || []);
        } else if (logsResp?.logs?.length) {
          setLogLines(prev => [...prev, ...logsResp.logs]);
        }

        if (typeof logsResp?.next_offset === 'number') {
          logOffsetRef.current = logsResp.next_offset;
        }

        const newLogsCount = logsResp?.logs?.length ?? 0;
        idleRuns = newLogsCount === 0 ? idleRuns + 1 : 0;

        if (jobResp?.status) {
          setJobStatus(jobResp.status);
        }

        const finished = jobResp && ['completed', 'failed'].includes(jobResp.status);

        if (finished && idleRuns >= 3) {
          setIsStreamingLogs(false);
          return;
        }

        timeoutId = setTimeout(poll, finished ? 2000 : 1200);
      } catch (err) {
        if (cancelled) return;
        setLogError(err.message);
        timeoutId = setTimeout(poll, 4000);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [jobId]);

  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [logLines]);

  if (loading) {
    return <div className="card">Loading parameter metadata…</div>;
  }

  if (loadError) {
    return <div className="card" style={{ color: 'crimson' }}>Error: {loadError}</div>;
  }

  const renderField = spec => {
    const defaultLabel = formatDefaultValue(spec);
    const label = spec.label || spec.name;
    const id = `train-${spec.name}`;
    const commonProps = {
      id,
      name: spec.name,
      value: values[spec.name] ?? '',
      onChange: event => handleInputChange(spec, event)
    };

    return (
      <div key={spec.name} className="field">
        <label htmlFor={id}>
          {label}
          {spec.help && <span className="helper-text">{spec.help}</span>}
        </label>
        {spec.name === 'dataset_path' ? (
          <>
            <input
              {...commonProps}
              type="text"
              placeholder="data/my_dataset.json"
            />
            <TrainDatasetUploader onUploaded={handleDatasetUploaded} />
          </>
        ) : spec.type === 'boolean' ? (
          <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <input
              id={id}
              type="checkbox"
              checked={Boolean(values[spec.name])}
              onChange={event => handleInputChange(spec, event)}
            />
            <span>{Boolean(values[spec.name]) ? 'Enabled' : 'Disabled'}</span>
          </label>
        ) : spec.type === 'json' ? (
          <textarea
            {...commonProps}
            placeholder='{"input": "{{instruction}}"}'
          />
        ) : spec.type === 'list' ? (
          <textarea
            {...commonProps}
            placeholder="Comma or newline separated values"
          />
        ) : (
          <input
            {...commonProps}
            type={spec.type === 'number' ? 'number' : 'text'}
            step={spec.subtype === 'float' ? '0.0001' : undefined}
          />
        )}
        {defaultLabel && <small>Default: {defaultLabel}</small>}
      </div>
    );
  };

  return (
    <div className="page page-train">
      <PageHeader
        title="Fine-tune a base model"
        lead="Stay in the guided lane: start with a dataset and adjust only the knobs that matter. Advanced controls are still here when you need them."
        actions={
          <button type="button" className="secondary" onClick={handleReset}>
            Reset to defaults
          </button>
        }
      />

      <HelpCallout title="No ML degree required">
        Provide a small set of example prompts and answers. We take care of applying QLoRA so you can focus on
        content quality instead of GPU settings.
      </HelpCallout>

      <form onSubmit={handleSubmit} className="grid" style={{ gap: '2rem' }}>
        <section className="card" aria-labelledby="essential-settings">
          <h2 id="essential-settings" className="card-title">
            Essentials you should review
          </h2>
          <p className="muted-text">
            These are the only fields most teams touch. Each has tooltips in the documentation if you want to learn more.
          </p>
          <div className="field">
            <label htmlFor="run_label">Run label</label>
            <input
              id="run_label"
              type="text"
              value={runLabel}
              onChange={handleRunLabelChange}
              placeholder="physics-qa-2024"
            />
            <small>Used to name the output folder and adapter entry.</small>
          </div>
          <div className="grid two-columns">
            {essentialSpecs.map(renderField)}
          </div>
        </section>

        <section className="card" aria-labelledby="advanced-controls">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <h2 id="advanced-controls" className="card-title">Advanced controls</h2>
            <div className="button-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={event => setShowAdvanced(event.target.checked)}
                  aria-controls="advanced-parameters"
                  aria-expanded={showAdvanced}
                />
                Show expert options
              </label>
            </div>
          </div>
          {showAdvanced ? (
            <>
              <div className="field">
                <label htmlFor="advanced-search">Find a setting</label>
                <input
                  id="advanced-search"
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Type to filter (e.g. warmup, scheduler)"
                />
              </div>
              <div id="advanced-parameters" className="grid" style={{ marginTop: '1.2rem', gap: '1.4rem' }}>
                {advancedGroups.length === 0 ? (
                  <div className="empty-state">No matching parameters. Clear the search to see all expert controls.</div>
                ) : (
                  advancedGroups.map(([category, fields]) => (
                    <details key={category} className="parameter-group">
                      <summary>
                        <span>{category}</span>
                        <span className="muted-text">{fields.length} options</span>
                      </summary>
                      <p className="helper-text" style={{ marginTop: '0.6rem' }}>
                        {ADVANCED_INFO[category] || 'Additional fine-grained settings.'}
                      </p>
                      <div className="parameter-grid">
                        {fields.map(renderField)}
                      </div>
                    </details>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="muted-text">Enable expert options to adjust LoRA, quantization, logging and saving behaviour.</p>
          )}
        </section>

        <div className="button-row">
          <button type="submit" className="primary">
            Start training
          </button>
          {jobId && (
            <span className="pill">Job queued · ID {jobId}</span>
          )}
        </div>

        {successMsg && <p style={{ color: '#065f46' }}>{successMsg}</p>}
        {formError && <p style={{ color: 'crimson' }}>{formError}</p>}
      </form>

      {jobId && (
        <section className="card card-muted" aria-labelledby="training-log">
          <div className="log-header">
            <h2 id="training-log" className="card-title" style={{ marginBottom: 0 }}>
              Live training log
            </h2>
            <span className={`status ${jobStatus || 'pending'}`}>
              {jobStatus || 'pending'}
            </span>
          </div>
          <p className="muted-text" style={{ marginTop: '0.4rem' }}>
            Streaming console output from the backend. This panel follows the newest entries automatically.
          </p>
          <div
            ref={logContainerRef}
            className="log-window"
            role="log"
            aria-live="polite"
            aria-busy={isStreamingLogs}
          >
            {logLines.length === 0 ? (
              <p className="muted-text" style={{ margin: 0 }}>
                {isStreamingLogs ? 'Waiting for log events…' : 'No log entries captured yet.'}
              </p>
            ) : (
              <pre className="log-stream">{logLines.join('\n')}</pre>
            )}
          </div>
          {logError && <p style={{ color: 'crimson', marginTop: '0.75rem' }}>{logError}</p>}
        </section>
      )}
    </div>
  );
}
