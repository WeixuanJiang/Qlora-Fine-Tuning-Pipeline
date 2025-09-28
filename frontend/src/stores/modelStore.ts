import { create } from 'zustand';
import type { ModelStore, Adapter } from '@/types';

interface ModelState extends ModelStore {
  // Actions
  setModels: (models: string[]) => void;
  setAdapters: (adapters: Adapter[]) => void;
  addAdapter: (adapter: Adapter) => void;
  updateAdapter: (id: string, updates: Partial<Adapter>) => void;
  removeAdapter: (id: string) => void;
  setSelectedModel: (model: string | null) => void;
  setSelectedAdapter: (adapter: Adapter | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshModels: () => Promise<void>;
  refreshAdapters: () => Promise<void>;
  uploadAdapter: (file: File, metadata: Partial<Adapter>) => Promise<void>;
  deleteAdapter: (id: string) => Promise<void>;
}

const useModelStore = create<ModelState>()((set, get) => ({
  // Initial state
  models: [],
  adapters: [],
  selectedModel: null,
  selectedAdapter: null,
  loading: false,
  error: null,

  // Actions
  setModels: (models) => set({ models }),

  setAdapters: (adapters) => set({ adapters }),

  addAdapter: (adapter) => {
    set((state) => ({
      adapters: [adapter, ...state.adapters],
    }));
  },

  updateAdapter: (id, updates) => {
    set((state) => ({
      adapters: state.adapters.map((adapter) =>
        adapter.id === id ? { ...adapter, ...updates } : adapter
      ),
      selectedAdapter:
        state.selectedAdapter?.id === id
          ? { ...state.selectedAdapter, ...updates }
          : state.selectedAdapter,
    }));
  },

  removeAdapter: (id) => {
    set((state) => ({
      adapters: state.adapters.filter((adapter) => adapter.id !== id),
      selectedAdapter:
        state.selectedAdapter?.id === id ? null : state.selectedAdapter,
    }));
  },

  setSelectedModel: (model) => set({ selectedModel: model }),

  setSelectedAdapter: (adapter) => set({ selectedAdapter: adapter }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  refreshModels: async () => {
    const { setLoading, setError, setModels } = get();
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const models = await response.json();
      setModels(models);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  },

  refreshAdapters: async () => {
    const { setLoading, setError, setAdapters } = get();
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/adapters');
      if (!response.ok) {
        throw new Error('Failed to fetch adapters');
      }
      const adapters = await response.json();
      setAdapters(adapters);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to fetch adapters'
      );
    } finally {
      setLoading(false);
    }
  },

  uploadAdapter: async (file, metadata) => {
    const { addAdapter, setError } = get();
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      // TODO: Replace with actual API call
      const response = await fetch('/api/adapters/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload adapter');
      }

      const newAdapter = await response.json();
      addAdapter(newAdapter);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to upload adapter'
      );
    }
  },

  deleteAdapter: async (id) => {
    const { removeAdapter, setError } = get();
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/adapters/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete adapter');
      }
      removeAdapter(id);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete adapter'
      );
    }
  },
}));

export default useModelStore;