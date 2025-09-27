const KIND_LABELS = {
  train: 'Training',
  evaluate: 'Evaluation',
  merge: 'Merge',
  publish: 'Hub upload'
};

const basename = value => {
  if (!value || typeof value !== 'string') return '';
  const parts = value.split(/[/\\\\]/);
  return parts[parts.length - 1] || value;
};

export const formatJobKind = kind => {
  if (!kind) return 'Job';
  return KIND_LABELS[kind] || kind.charAt(0).toUpperCase() + kind.slice(1);
};

export const formatJobSummary = job => {
  if (!job) return '—';
  if (job.summary && job.summary.trim()) return job.summary;

  const metadata = job.metadata || {};

  switch (job.kind) {
    case 'train': {
      const model = metadata.model_name || 'model';
      const dataset = basename(metadata.dataset_path) || metadata.dataset_name;
      if (dataset) {
        return `Fine-tune ${model} on ${dataset}`;
      }
      return `Fine-tune ${model}`;
    }
    case 'evaluate': {
      const pred = basename(metadata.predictions_file);
      const ref = basename(metadata.reference_file);
      if (pred && ref) {
        return `Evaluate ${pred} vs ${ref}`;
      }
      return 'Evaluation job';
    }
    case 'merge': {
      const adapter = basename(metadata.adapter_path);
      const output = basename(metadata.output_dir);
      if (adapter && output) {
        return `Merge ${adapter} -> ${output}`;
      }
      return 'Merge adapters';
    }
    case 'publish': {
      const source = basename(metadata.source_dir);
      const repo = metadata.repo_id;
      if (source && repo) {
        return `Upload ${source} to ${repo}`;
      }
      return 'Upload to Hugging Face';
    }
    default:
      return 'Background job';
  }
};

const formatMetric = metrics => {
  if (!metrics || typeof metrics !== 'object') return null;
  const entries = Object.entries(metrics);
  if (!entries.length) return null;
  const [name, value] = entries[0];
  if (typeof value === 'number') {
    return `${name}: ${value.toFixed(4)}`;
  }
  return `${name}: ${value}`;
};

export const formatJobOutcome = job => {
  if (!job) return '—';
  if (job.error) return job.error;

  const { result, status, kind } = job;
  if (result === undefined || result === null) {
    return status === 'completed' ? 'Completed' : '—';
  }

  if (typeof result === 'string') return result;
  if (typeof result === 'number') return String(result);
  if (typeof result === 'boolean') return result ? 'Completed' : 'Failed';
  if (Array.isArray(result)) return `${result.length} item${result.length === 1 ? '' : 's'}`;

  if (typeof result === 'object') {
    if (kind === 'publish' && result.repo_id) {
      return `Uploaded to ${result.repo_id}`;
    }
    if (kind === 'merge') {
      return 'Merged successfully';
    }
    if (kind === 'evaluate' && result.metrics) {
      const metric = formatMetric(result.metrics);
      if (metric) return metric;
    }
    if (result.message) return result.message;
    if (result.detail) return result.detail;
    const entries = Object.entries(result);
    if (entries.length) {
      const [key, value] = entries[0];
      if (typeof value === 'object') {
        return key;
      }
      return `${key}: ${value}`;
    }
  }

  return status === 'completed' ? 'Completed' : '—';
};

