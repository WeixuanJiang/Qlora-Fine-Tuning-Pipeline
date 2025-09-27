import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import HelpCallout from '../components/HelpCallout.jsx';
import { triggerEvaluation, getJob, getStorageCatalog } from '../utils/api.js';
import { loadSettings, SETTINGS_EVENT } from '../utils/settings.js';

const defaultState = {
  predictions_file: 'predictions/predictions.json',
  reference_file: 'data/physics_test_qa.json',
  output_file: 'evaluation/latest_evaluation.json',
  model: ''
};


export default function EvaluatePage() {
  const [form, setForm] = useState(defaultState);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [settings, setSettings] = useState(() => loadSettings());
  const hasOpenAiKey = Boolean(settings.openaiApiKey);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobResult, setJobResult] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

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

  useEffect(() => {
    getStorageCatalog()
      .then(data => {
        setCatalog(data);
        setCatalogError(null);
      })
      .catch(err => setCatalogError(err.message))
      .finally(() => setIsCatalogLoading(false));
  }, []);

  const buildOptions = entries => {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries.map(entry => ({
      value: entry.path,
      label: entry.label || entry.path
    }));
  };

  const predictionsOptions = useMemo(() => buildOptions(catalog?.predictions), [catalog]);
  const referencesOptions = useMemo(() => buildOptions(catalog?.references), [catalog]);
  const evaluationOutputOptions = useMemo(() => {
    const options = buildOptions(catalog?.evaluation_results);
    const defaultPath = 'evaluation/latest_evaluation.json';
    if (!options.some(option => option.value === defaultPath)) {
      options.unshift({ value: defaultPath, label: defaultPath });
    }
    return options;
  }, [catalog]);

  useEffect(() => {
    setForm(prev => {
      let updated = prev;
      let changed = false;

      if (predictionsOptions.length && !predictionsOptions.some(option => option.value === prev.predictions_file)) {
        updated = { ...updated, predictions_file: predictionsOptions[0].value };
        changed = true;
      }

      if (referencesOptions.length && !referencesOptions.some(option => option.value === prev.reference_file)) {
        updated = { ...updated, reference_file: referencesOptions[0].value };
        changed = true;
      }

      if (
        evaluationOutputOptions.length &&
        prev.output_file &&
        !evaluationOutputOptions.some(option => option.value === prev.output_file)
      ) {
        updated = { ...updated, output_file: evaluationOutputOptions[0].value };
        changed = true;
      }

      return changed ? updated : prev;
    });
  }, [predictionsOptions, referencesOptions, evaluationOutputOptions]);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setJobStatus(null);
    setJobResult(null);

    if (form.model && !settings.openaiApiKey) {
      setError('Set your OpenAI API key in Settings before using an evaluator model.');
      return;
    }

    const payload = {
      predictions_file: form.predictions_file,
      reference_file: form.reference_file,
      output_file: form.output_file || undefined,
      model: form.model || undefined,
      openai_api_key: settings.openaiApiKey || undefined
    };

    triggerEvaluation(payload)
      .then(resp => {
        setJobId(resp.job_id);
        setIsPolling(true);
        setMessage('Evaluation job queued. Monitoring progress…');
      })
      .catch(err => setError(err.message));
  };

  const handleReset = () => {
    setForm(defaultState);
    setJobId(null);
    setError(null);
    setMessage(null);
    setJobStatus(null);
    setJobResult(null);
    setIsPolling(false);
  };

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    let active = true;
    const poll = async () => {
      try {
        const data = await getJob(jobId);
        if (!active) return;
        setJobStatus(data);
        if (data.status === 'completed') {
          setJobResult(data.result || null);
          setMessage('Evaluation complete. Review the results below or open the JSON output.');
          setIsPolling(false);
          return true;
        }
        if (data.status === 'failed') {
          setError(data.error || 'Evaluation failed. Check Activity for details.');
          setIsPolling(false);
          return true;
        }
        return false;
      } catch (err) {
        if (!active) return true;
        setError(err.message);
        setIsPolling(false);
        return true;
      }
    };

    let intervalId;
    const start = async () => {
      const stop = await poll();
      if (stop || !active) {
        return;
      }
      intervalId = setInterval(async () => {
        const shouldStop = await poll();
        if (shouldStop && intervalId) {
          clearInterval(intervalId);
          intervalId = undefined;
        }
      }, 2500);
    };

    start();

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId]);

  const outputPath = jobResult?.metadata?.output_file || (form.output_file || '');
  const aggregateMetrics = jobResult?.aggregate_metrics || null;
  const evaluatedCount = jobResult?.evaluations?.length ?? null;

  return (
    <div className="page page-evaluate">
      <PageHeader
        title="Score your model"
        lead="Compare predictions with ground truth answers and optionally involve an evaluator LLM for rubric-based scoring."
        actions={
          <button type="button" className="secondary" onClick={handleReset}>
            Reset form
          </button>
        }
      />

      <HelpCallout title="Why evaluate?">
        Consistent evaluations help you prove the model is improving release after release. Share the summary JSON with teammates to highlight wins and failures.
      </HelpCallout>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: '1.4rem' }}>
        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="predictions_file">Predictions file</label>
            <select
              id="predictions_file"
              name="predictions_file"
              value={form.predictions_file}
              onChange={handleChange}
              disabled={isCatalogLoading || !predictionsOptions.length}
              required
            >
              <option value="" disabled>
                {isCatalogLoading ? 'Loading predictions…' : 'Select predictions file'}
              </option>
              {predictionsOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>Output from your inference run. JSON/JSONL with model answers.</small>
            {catalogError && <small style={{ color: 'crimson' }}>{catalogError}</small>}
          </div>
          <div className="field">
            <label htmlFor="reference_file">Reference answers</label>
            <select
              id="reference_file"
              name="reference_file"
              value={form.reference_file}
              onChange={handleChange}
              disabled={isCatalogLoading || !referencesOptions.length}
              required
            >
              <option value="" disabled>
                {isCatalogLoading ? 'Loading references…' : 'Select reference answers'}
              </option>
              {referencesOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>Ground truth file used to measure accuracy.</small>
          </div>
        </div>

        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="output_file">Save results to</label>
            <select
              id="output_file"
              name="output_file"
              value={form.output_file}
              onChange={handleChange}
              disabled={isCatalogLoading || !evaluationOutputOptions.length}
            >
              {evaluationOutputOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>Stored locally so you can inspect the JSON afterwards.</small>
          </div>
          <div className="field">
            <label htmlFor="model">Evaluator model (optional)</label>
            <input
              id="model"
              name="model"
              type="text"
              value={form.model}
              onChange={handleChange}
              placeholder="e.g. gpt-4o-mini"
            />
            <small>
              Used for LLM-based grading. Leave blank for automatic metrics only. API key in Settings:{' '}
              {hasOpenAiKey ? 'configured' : 'not set'}.
            </small>
          </div>
        </div>

        <div className="button-row">
          <button type="submit" className="primary">Start evaluation</button>
          {jobId && (
            <span className="pill">
              {isPolling ? 'Job running' : 'Job queued'} · ID {jobId}
            </span>
          )}
        </div>

        {message && <p style={{ color: '#065f46', margin: 0 }}>{message}</p>}
        {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
      </form>

      {jobStatus && (
        <div className="card">
          <h2 className="card-title">Latest evaluation status</h2>
          <p className="muted-text" style={{ marginTop: 0 }}>
            Status: <span className={`status ${jobStatus.status || 'pending'}`}>{jobStatus.status || 'pending'}</span>
          </p>
          {outputPath && (
            <>
              <p className="muted-text">
                Results saved to: <code>{outputPath}</code>
              </p>
              <p className="muted-text">
                <Link to={`/evaluate/dashboard?path=${encodeURIComponent(outputPath)}`}>
                  Open in evaluation dashboard
                </Link>
              </p>
            </>
          )}
          {aggregateMetrics && (
            <div className="grid two-columns" style={{ marginTop: '1rem' }}>
              {Object.entries(aggregateMetrics).map(([key, value]) => (
                <div key={key} className="stat-card">
                  <small>{key.replace('avg_', '').replace('_', ' ')}</small>
                  <strong>{typeof value === 'number' ? value.toFixed(2) : value}</strong>
                </div>
              ))}
            </div>
          )}
          {evaluatedCount !== null && (
            <p className="muted-text">Samples evaluated: {evaluatedCount}</p>
          )}
          {jobStatus.error && <p style={{ color: 'crimson' }}>{jobStatus.error}</p>}
        </div>
      )}
    </div>
  );
}
