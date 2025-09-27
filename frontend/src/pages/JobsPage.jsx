import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import HelpCallout from '../components/HelpCallout.jsx';
import { getJob, listJobs } from '../utils/api.js';
import { formatJobKind, formatJobOutcome, formatJobSummary } from '../utils/jobs.js';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshJobs = () => {
    setLoading(true);
    listJobs()
      .then(data => setJobs(data.jobs || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshJobs();
  }, []);

  const handleSelectJob = jobId => {
    setSelectedJobId(jobId);
    setSelectedJob(null);
    if (!jobId) return;
    getJob(jobId)
      .then(data => setSelectedJob(data))
      .catch(err => setError(err.message));
  };

  return (
    <div className="page page-jobs">
      <PageHeader
        title="Activity dashboard"
        lead="Track every background job from training to evaluation. Select a row to inspect the raw payload and results."
        actions={
          <button type="button" className="primary" onClick={refreshJobs} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh jobs'}
          </button>
        }
      />

      <HelpCallout title="Need to troubleshoot?">
        Look for jobs stuck in pending or failed states. Click “Inspect” to view detailed errors, then adjust your settings and relaunch.
      </HelpCallout>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <div className="card">
        <h2 className="card-title">Recent activity</h2>
        {jobs.length === 0 ? (
          <div className="empty-state">No jobs yet. Kick off training, generation, evaluation or merge tasks to populate this table.</div>
        ) : (
          <table className="table" aria-label="Job history">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Job</th>
                <th scope="col">Status</th>
                <th scope="col">Details</th>
                <th scope="col">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td><span className="pill">{formatJobKind(job.kind)}</span></td>
                  <td>
                    <div>{formatJobSummary(job)}</div>
                    <div className="muted-text" style={{ fontSize: '0.75rem' }}>
                      ID <code>{job.id}</code>
                    </div>
                  </td>
                  <td><span className={`status ${job.status || 'pending'}`}>{job.status || 'pending'}</span></td>
                  <td>{formatJobOutcome(job)}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '0.45rem 0.9rem' }}
                      onClick={() => handleSelectJob(job.id)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedJob && (
        <div className="card card-muted">
          <h2 className="card-title">Job detail</h2>
          <p className="muted-text">Job ID: <code>{selectedJobId}</code></p>
          <p className="muted-text">Type: {formatJobKind(selectedJob.kind)}</p>
          <p className="muted-text">Summary: {formatJobSummary(selectedJob)}</p>
          <p className="muted-text">Outcome: {formatJobOutcome(selectedJob)}</p>
          <pre aria-live="polite">{JSON.stringify(selectedJob, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
