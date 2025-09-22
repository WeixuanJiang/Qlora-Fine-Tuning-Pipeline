import { useEffect, useState } from 'react';
import { API_BASE_URL, listJobs, listAdapters } from '../utils/api.js';

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

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Welcome to the QLoRA Control Center</h2>
      <p>API base: <code>{API_BASE_URL}</code></p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <section>
        <h3 className="section-title">Recent Jobs</h3>
        {jobs.length === 0 ? (
          <p>No jobs yet. Start a training, evaluation, or merge task.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Status</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(-5).reverse().map(job => (
                <tr key={job.id}>
                  <td style={{ fontFamily: 'monospace' }}>{job.id}</td>
                  <td><span className={`status ${job.status}`}>{job.status}</span></td>
                  <td>{job.error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3 className="section-title">Registered Adapters</h3>
        {adapters.length === 0 ? (
          <p>No adapters registered yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Path</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {adapters.map((adapter, idx) => (
                <tr key={`${adapter.path}-${idx}`}>
                  <td>{adapter.name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{adapter.path}</td>
                  <td>{adapter.description || '—'}</td>
                  <td>{adapter.training_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
