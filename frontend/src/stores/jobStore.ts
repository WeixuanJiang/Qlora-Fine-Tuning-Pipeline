import { create } from 'zustand';
import type { JobStore, Job, JobFilters } from '@/types';

interface JobState extends JobStore {
  // Actions
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;
  setSelectedJob: (job: Job | null) => void;
  setFilters: (filters: Partial<JobFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshJobs: () => Promise<void>;
  startJob: (id: string) => Promise<void>;
  stopJob: (id: string) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
}

export const useJobStore = create<JobState>()((set, get) => ({
  // Initial state
  jobs: [],
  selectedJob: null,
  filters: {
    status: 'all',
    search: '',
    dateRange: null,
  },
  loading: false,
  error: null,

  // Actions
  setJobs: (jobs) => set({ jobs }),

  addJob: (job) => {
    set((state) => ({
      jobs: [job, ...state.jobs],
    }));
  },

  updateJob: (id, updates) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, ...updates } : job
      ),
      selectedJob:
        state.selectedJob?.id === id
          ? { ...state.selectedJob, ...updates }
          : state.selectedJob,
    }));
  },

  removeJob: (id) => {
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
      selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
    }));
  },

  setSelectedJob: (job) => set({ selectedJob: job }),

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  refreshJobs: async () => {
    const { setLoading, setError, setJobs } = get();
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const jobs = await response.json();
      setJobs(jobs);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  },

  startJob: async (id) => {
    const { updateJob, setError } = get();
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/jobs/${id}/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start job');
      }
      const updatedJob = await response.json();
      updateJob(id, updatedJob);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start job');
    }
  },

  stopJob: async (id) => {
    const { updateJob, setError } = get();
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/jobs/${id}/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to stop job');
      }
      const updatedJob = await response.json();
      updateJob(id, updatedJob);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to stop job');
    }
  },

  deleteJob: async (id) => {
    const { removeJob, setError } = get();
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      removeJob(id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete job');
    }
  },
}));

export default useJobStore;
