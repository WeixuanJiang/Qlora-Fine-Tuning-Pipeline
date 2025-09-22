import { useEffect, useMemo, useState } from 'react';
import { getTrainParameters, triggerTraining } from '../utils/api.js';
import TrainDatasetUploader from '../components/TrainDatasetUploader.jsx';

const ADVANCED_CATEGORIES = new Set([
  'LoRA',
  'Quantization',
  'Prompt',
  'Tracking',
  'Model Saving',
  'Misc'
]);

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
        .split(/[,\n]/)
        .map(item => item.trim())
        .filter(Boolean);
    case 'json':
      if (typeof raw === 'object') return raw;
      return JSON.parse(raw);
    default:
      return raw;
  }
};

export default function TrainPage() {
  const [specs, setSpecs] = useState([]);
  const [values, setValues] = useState({});
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

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
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredGroups = useMemo(() => {
    const groups = {};
    const term = searchTerm.trim().toLowerCase();

    specs.forEach(spec => {
      const category = spec.category || 'Other';
      const isAdvanced = ADVANCED_CATEGORIES.has(category);
      if (!showAdvanced && isAdvanced) {
        return;
      }

      if (term) {
        const haystack = `${spec.label || ''} ${spec.name}`.toLowerCase();
        if (!haystack.includes(term)) {
          return;
        }
      }

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(spec);
    });

    return groups;
  }, [specs, showAdvanced, searchTerm]);

  const handleInputChange = (spec, event) => {
    if (spec.type === 'boolean') {
      setValues(prev => ({ ...prev, [spec.name]: event.target.checked }));
    } else {
      setValues(prev => ({ ...prev, [spec.name]: event.target.value }));
    }
  };

  const handleDatasetUploaded = payload => {
    if (payload?.path) {
      setValues(prev => ({ ...prev, dataset_path: payload.path }));
      setSuccessMsg(`Uploaded dataset saved to ${payload.path}`);
    }
  };

  const handleReset = () => {
    setValues(defaults);
    setSuccessMsg(null);
    setError(null);
  };

  const handleSubmit = event => {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {};
      specs.forEach(spec => {
        const raw = values[spec.name];
        const parsed = parseValue(spec, raw);
        if (parsed !== undefined && parsed !== '') {
          payload[spec.name] = parsed;
        }
      });

      triggerTraining(payload)
        .then(resp => {
          setJobId(resp.job_id);
          setSuccessMsg('Training job queued successfully.');
        })
        .catch(err => setError(err.message));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCategory = category => {
    setCollapsed(prev => ({ ...prev, [category]: !prev[category] }));
  };

  if (loading) {
    return <div className="card">Loading parameter metadata…</div>;
  }

  if (error) {
    return <div className="card" style={{ color: 'crimson' }}>Error: {error}</div>;
  }

  const categoryEntries = Object.entries(filteredGroups).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Configure Training Run</h2>

      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          background: '#f8fafc'
        }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder="Search parameters…"
          style={{
            padding: '0.6rem 0.75rem',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            flex: '1 1 260px'
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={event => setShowAdvanced(event.target.checked)}
          />
          Show advanced categories
        </label>
        <button type="button" className="primary" style={{ background: '#4b5563' }} onClick={handleReset}>
          Reset to defaults
        </button>
      </div>

      {categoryEntries.length === 0 ? (
        <p>No parameters match the current filter. Adjust the search or show advanced options.</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid">
          {categoryEntries.map(([category, fields]) => (
            <fieldset key={category} className="card" style={{ margin: 0 }}>
              <legend
                style={{
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => toggleCategory(category)}
              >
                <span>{category}</span>
                <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                  {fields.length} {fields.length === 1 ? 'parameter' : 'parameters'}{' '}
                  {ADVANCED_CATEGORIES.has(category) && '(advanced)'}
                </span>
              </legend>
              {!collapsed[category] && (
                <div className="grid two-columns">
                  {fields.map(spec => (
                    <div key={spec.name} className="field">
                      <label htmlFor={spec.name}>
                        {spec.label || spec.name}
                        {spec.help && (
                          <small style={{ display: 'block', color: '#6b7280' }}>{spec.help}</small>
                        )}
                        {formatDefaultValue(spec) && (
                          <small style={{ color: '#9ca3af' }}>
                            Default: {formatDefaultValue(spec)}
                          </small>
                        )}
                      </label>
                      {spec.name === 'dataset_path' ? (
                        <>
                          <input
                            id={spec.name}
                            type="text"
                            value={values[spec.name] ?? ''}
                            onChange={event => handleInputChange(spec, event)}
                            placeholder="data/my_dataset.json"
                          />
                          <TrainDatasetUploader onUploaded={handleDatasetUploaded} />
                        </>
                      ) : spec.type === 'boolean' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            id={spec.name}
                            type="checkbox"
                            checked={Boolean(values[spec.name])}
                            onChange={event => handleInputChange(spec, event)}
                          />
                          <span>{Boolean(values[spec.name]) ? 'Enabled' : 'Disabled'}</span>
                        </label>
                      ) : spec.type === 'json' ? (
                        <textarea
                          id={spec.name}
                          value={values[spec.name] ?? ''}
                          onChange={event => handleInputChange(spec, event)}
                          placeholder='{"key": "value"}'
                        />
                      ) : spec.type === 'list' ? (
                        <textarea
                          id={spec.name}
                          value={values[spec.name] ?? ''}
                          onChange={event => handleInputChange(spec, event)}
                          placeholder="Comma or newline separated"
                        />
                      ) : (
                        <input
                          id={spec.name}
                          type={spec.type === 'number' ? 'number' : 'text'}
                          step={spec.subtype === 'float' ? '0.0001' : undefined}
                          value={values[spec.name] ?? ''}
                          onChange={event => handleInputChange(spec, event)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          ))}
          <button type="submit" className="primary">Start Training</button>
        </form>
      )}

      {successMsg && <p style={{ color: '#065f46' }}>{successMsg}</p>}
      {jobId && (
        <p>
          Job ID: <code>{jobId}</code>
        </p>
      )}
    </div>
  );
}
