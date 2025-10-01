import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Dataset {
  name: string;
  path: string;
  size_bytes: number;
  size_mb: number;
  modified: number;
  format: string;
}

export interface DatasetStats {
  num_examples: number;
  columns: string[];
  column_types: Record<string, string>;
  missing_values: Record<string, number>;
  text_length_stats: Record<string, {
    mean: number;
    min: number;
    max: number;
    median: number;
    std: number;
  }>;
  sample_examples: Array<Record<string, any>>;
  file_size_bytes: number;
  format: string;
}

export interface DatasetInfo {
  path: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: DatasetStats;
}

export interface DatasetPreview {
  success: boolean;
  num_examples?: number;
  columns?: string[];
  samples?: Array<Record<string, any>>;
  error?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: DatasetStats;
}

interface DatasetStore {
  // State
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  datasetInfo: DatasetInfo | null;
  preview: DatasetPreview | null;
  loading: boolean;
  error: string | null;
  uploadProgress: number;

  // Actions
  fetchDatasets: () => Promise<void>;
  getDatasetInfo: (datasetName: string) => Promise<void>;
  previewDataset: (datasetName: string, numExamples?: number) => Promise<void>;
  uploadDataset: (file: File, destination?: string) => Promise<void>;
  validateDataset: (file: File) => Promise<ValidationResult>;
  selectDataset: (dataset: Dataset | null) => void;
  clearPreview: () => void;
  setError: (error: string | null) => void;
}

export const useDatasetStore = create<DatasetStore>()((set, get) => ({
  // Initial state
  datasets: [],
  selectedDataset: null,
  datasetInfo: null,
  preview: null,
  loading: false,
  error: null,
  uploadProgress: 0,

  // Actions
  fetchDatasets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/datasets`);
      set({ datasets: response.data.datasets, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch datasets',
        loading: false
      });
    }
  },

  getDatasetInfo: async (datasetName: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/datasets/${datasetName}/info`);
      set({ datasetInfo: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to get dataset info',
        loading: false
      });
    }
  },

  previewDataset: async (datasetName: string, numExamples = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `${API_BASE}/datasets/${datasetName}/preview`,
        { params: { num_examples: numExamples } }
      );
      set({ preview: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to preview dataset',
        loading: false
      });
    }
  },

  uploadDataset: async (file: File, destination = 'data') => {
    set({ loading: true, error: null, uploadProgress: 0 });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('destination', destination);

      await axios.post(`${API_BASE}/datasets/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          set({ uploadProgress: progress });
        },
      });

      set({ loading: false, uploadProgress: 100 });
      // Refresh datasets list after upload
      await get().fetchDatasets();
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to upload dataset',
        loading: false,
        uploadProgress: 0,
      });
      throw error;
    }
  },

  validateDataset: async (file: File): Promise<ValidationResult> => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/datasets/validate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to validate dataset',
        loading: false
      });
      throw error;
    }
  },

  selectDataset: (dataset: Dataset | null) => {
    set({ selectedDataset: dataset });
  },

  clearPreview: () => {
    set({ preview: null, datasetInfo: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));

export default useDatasetStore;