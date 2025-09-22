import { useState } from 'react';
import { triggerEvaluation } from '../utils/api.js';

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

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload = {
      predictions_file: form.predictions_file,
      reference_file: form.reference_file,
      output_file: form.output_file || undefined,
      model: form.model || undefined
    };

    triggerEvaluation(payload)
      .then(resp => {
        setJobId(resp.job_id);
        setMessage('Evaluation job queued. Check the Jobs page for progress.');
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Evaluate Predictions</h2>
      <form onSubmit={handleSubmit} className="grid">
        <div className="grid two-columns">
          <div className="field">
            <label htmlFor="predictions_file">Predictions File</label>
            <input
              id="predictions_file"
              name="predictions_file"
              type="text"
              value={form.predictions_file}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reference_file">Reference File</label>
            <input
              id="reference_file"
              name="reference_file"
              type="text"
              value={form.reference_file}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="output_file">Output File</label>
            <input
              id="output_file"
              name="output_file"
              type="text"
              value={form.output_file}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="model">Evaluator Model (optional)</label>
            <input
              id="model"
              name="model"
              type="text"
              value={form.model}
              onChange={handleChange}
              placeholder="e.g. gpt-4o-mini"
            />
          </div>
        </div>
        <button type="submit" className="primary">Start Evaluation</button>
      </form>
      {message && <p style={{ color: '#065f46' }}>{message}</p>}
      {jobId && <p>Job ID: <code>{jobId}</code></p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}
