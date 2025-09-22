import { useEffect, useState } from 'react';
import { getJob, listJobs } from '../utils/api.js';

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
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Job Monitor</h2>
      <button className="primary" style={{ maxWidth: 180 }} onClick={refreshJobs} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh Jobs'}
      </button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <table className="table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Status</th>
            <th>Error</th>
            <th>Result</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id}>
              <td style={{ fontFamily: 'monospace' }}>{job.id}</td>
              <td><span className={`status ${job.status}`}>{job.status}</span></td>
              <td>{job.error || '—'}</td>
              <td>{job.result ? 'Available' : '—'}</td>
              <td>
                <button type="button" className="primary" style={{ padding: '0.35rem 0.8rem' }} onClick={() => handleSelectJob(job.id)}>
                  Inspect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedJob && (
        <div className="card" style={{ background: '#f8fafc' }}>
          <h3>Job Detail</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedJob, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
