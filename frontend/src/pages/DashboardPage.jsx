import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import HelpCallout from '../components/HelpCallout.jsx';
import { API_BASE_URL, listJobs, listAdapters } from '../utils/api.js';
import { formatJobKind, formatJobOutcome, formatJobSummary } from '../utils/jobs.js';

export default function DashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [adapters, setAdapters] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listJobs()
      .then(data => setJobs(data.jobs || []))
      .catch(err => setError(err.message));
    listAdapters()
      .then(data => setAdapters(data.adapters || []))
      .catch(err => setError(err.message));
  }, []);

  const recentJobs = useMemo(() => jobs.slice(-5).reverse(), [jobs]);

  return (
    <div className="page page-dashboard">
      <PageHeader
        title="Welcome to QLoRA Copilot"
        lead="Follow the guided workflow to fine-tune, evaluate, and share custom language models without needing low-level ML expertise."
      />

      <HelpCallout title="Getting started is simple">
        Choose the Fine-tune tab to upload a dataset and kick off training, then try the new model on the Try the model page.
        Use Activity to track every job in one place.
      </HelpCallout>

      <div className="info-grid" style={{ marginBottom: '2rem' }}>
        <div className="info-card">
          <h3>Where is the backend running?</h3>
          <p className="muted-text">All actions talk to your API server at:</p>
          <code>{API_BASE_URL}</code>
        </div>
        <div className="info-card">
          <h3>Latest activity</h3>
          <p className="muted-text">Check the Activity tab to follow status changes in real time.</p>
          <span className="pill">Jobs tracked: {jobs.length}</span>
        </div>
        <div className="info-card">
          <h3>Adapters on disk</h3>
          <p className="muted-text">Merge or download your trained adapters from the Publish tab.</p>
          <span className="pill">Available adapters: {adapters.length}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Recent jobs</h2>
        {recentJobs.length === 0 ? (
          <div className="empty-state">No jobs yet. Launch a training run to see progress here.</div>
        ) : (
          <table className="table" aria-label="Latest jobs">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Job</th>
                <th scope="col">Status</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map(job => (
                <tr key={job.id}>
                  <td>
                    <span className="pill">{formatJobKind(job.kind)}</span>
                  </td>
                  <td>
                    <div>{formatJobSummary(job)}</div>
                    <div className="muted-text" style={{ fontSize: '0.75rem' }}>
                      ID <code>{job.id}</code>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${job.status || 'pending'}`}>{job.status || 'pending'}</span>
                  </td>
                  <td>{formatJobOutcome(job)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Registered adapters</h2>
        {adapters.length === 0 ? (
          <div className="empty-state">No adapters registered yet. Train a model or upload an existing LoRA to see it here.</div>
        ) : (
          <table className="table" aria-label="Registered adapters">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Path</th>
                <th scope="col">Description</th>
                <th scope="col">Trained on</th>
              </tr>
            </thead>
            <tbody>
              {adapters.map((adapter, idx) => (
                <tr key={`${adapter.path}-${idx}`}>
                  <td>{adapter.name || 'Adapter'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{adapter.path}</td>
                  <td>{adapter.description || '—'}</td>
                  <td>{adapter.training_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && <p style={{ color: 'crimson' }}>Unable to load dashboard data: {error}</p>}
    </div>
  );
}
