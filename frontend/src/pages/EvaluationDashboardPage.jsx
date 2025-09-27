import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import HelpCallout from '../components/HelpCallout.jsx';
import { getEvaluationResults, getStorageCatalog } from '../utils/api.js';

const DEFAULT_PATH = 'evaluation/run_2024-26-11_0532/results/evaluation_results.json';


const MetricBar = ({ label, value }) => {
  const clamped = Math.max(0, Math.min(10, value ?? 0));
  const percent = (clamped / 10) * 100;
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span>{label}</span>
        <strong>{clamped.toFixed(2)}</strong>
      </div>
      <div className="metric-bar">
        <div className="metric-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const useQueryPath = defaultPath => {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('path') || defaultPath;
  }, [location.search, defaultPath]);
};

export default function EvaluationDashboardPage() {
  const initialPath = useQueryPath(DEFAULT_PATH);
  const [path, setPath] = useState(initialPath);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  const loadResults = useCallback(inputPath => {
    setLoading(true);
    setError(null);
    getEvaluationResults(inputPath)
      .then(resp => setData(resp))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadResults(initialPath);
    setPath(initialPath);
  }, [initialPath, loadResults]);

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

  const evaluationOptions = useMemo(() => {
    const options = buildOptions(catalog?.evaluation_results);
    const defaultPath = 'evaluation/latest_evaluation.json';
    if (!options.some(option => option.value === defaultPath)) {
      options.unshift({ value: defaultPath, label: defaultPath });
    }
    return options;
  }, [catalog]);

  useEffect(() => {
    if (isCatalogLoading || !evaluationOptions.length) {
      return;
    }
    if (evaluationOptions.some(option => option.value === path)) {
      return;
    }
    const fallback = evaluationOptions[0].value;
    setPath(fallback);
    loadResults(fallback);
  }, [evaluationOptions, isCatalogLoading, loadResults, path]);

  const handleSubmit = event => {
    event.preventDefault();
    loadResults(path);
  };

  const aggregateMetrics = data?.aggregate_metrics || {};
  const evaluations = data?.evaluations || [];
  const metadata = data?.metadata || {};

  return (
    <div className="page page-eval-dashboard">
      <PageHeader
        title="Evaluation dashboard"
        lead="Visualise aggregate metrics and inspect per-sample grading insights from your evaluation runs."
      />

      <HelpCallout title="How is this data generated?">
        The dashboard reads the JSON output produced by the evaluation job. You can re-run assessments from the Evaluate
        page or load historical results saved under evaluation/. Use Settings to update your OpenAI key if you rely on an
        LLM-based grader.
      </HelpCallout>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: '1.2rem' }}>
        <div className="field">
          <label htmlFor="results_path">Evaluation results file</label>
          <select
            id="results_path"
            name="results_path"
            value={path}
            onChange={event => setPath(event.target.value)}
            disabled={isCatalogLoading || !evaluationOptions.length}
            required
          >
            {evaluationOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>Pick from completed evaluation outputs saved under the workspace.</small>
          {catalogError && <small style={{ color: 'crimson' }}>{catalogError}</small>}
        </div>
        <div className="button-row">
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Loading…' : 'Load results'}
          </button>
          {metadata.source_path && <span className="pill">Loaded from {metadata.source_path}</span>}
        </div>
        {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
      </form>

      {data && (
        <>
          <div className="card">
            <h2 className="card-title">Aggregate metrics</h2>
            <div className="grid two-columns">
              {Object.entries(aggregateMetrics).map(([key, value]) => (
                <MetricBar key={key} label={key.replace('avg_', '').replace('_', ' ')} value={value} />
              ))}
            </div>
            <div className="muted-text" style={{ marginTop: '0.75rem' }}>
              Model: <strong>{metadata.model || 'unknown'}</strong> · Samples evaluated: <strong>{evaluations.length}</strong>
              {' '}· Evaluated on <strong>{metadata.evaluation_date ? new Date(metadata.evaluation_date).toLocaleString() : 'n/a'}</strong>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Sample breakdown</h2>
            {evaluations.length === 0 ? (
              <div className="empty-state">No evaluation entries found in this file.</div>
            ) : (
              <table className="table" aria-label="Evaluation samples">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Relevance</th>
                    <th scope="col">Completeness</th>
                    <th scope="col">Clarity</th>
                    <th scope="col">Accuracy</th>
                    <th scope="col">Question & analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map(item => (
                    <tr key={item.sample_id}>
                      <td>{item.sample_id}</td>
                      <td>{item.metrics.relevance_score?.toFixed(2)}</td>
                      <td>{item.metrics.completeness_score?.toFixed(2)}</td>
                      <td>{item.metrics.clarity_score?.toFixed(2)}</td>
                      <td>{item.metrics.factual_accuracy?.toFixed(2)}</td>
                      <td style={{ maxWidth: '520px' }}>
                        <details>
                          <summary>{item.question}</summary>
                          <div className="evaluation-detail">
                            <p><strong>Reference:</strong> {item.reference}</p>
                            <p><strong>Prediction:</strong> {item.prediction}</p>
                            <p><strong>Explanation:</strong> {item.metrics.explanation}</p>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
