import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import { useEffect } from 'react';
import axios from 'axios';
import type { ApiResponse, ApiError } from '@/types';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
    };
    return Promise.reject(apiError);
  }
);

// Health check hook
export const useHealthCheck = () => {
  const { setApiStatus } = useAppStore();

  const { data, error, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ status: string; timestamp: string }>>('/health');
      return response.data;
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (data?.success) {
      setApiStatus('connected');
    } else if (error) {
      setApiStatus('error');
    } else if (isLoading) {
      setApiStatus('connecting');
    }
  }, [data, error, isLoading, setApiStatus]);

  return {
    isHealthy: data?.success || false,
    isLoading,
    error: error as ApiError | null,
  };
};

// Generic API hooks
export const useApiQuery = <T>(
  key: string[],
  endpoint: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) => {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<T>>(endpoint);
      return response.data.data;
    },
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime,
  });
};

export const useApiMutation = <TData, TVariables>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    invalidateQueries?: string[][];
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.request<ApiResponse<TData>>({
        url: endpoint,
        method,
        data: variables,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
      // Invalidate related queries
      options?.invalidateQueries?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
    onError: (error: ApiError) => {
      options?.onError?.(error);
    },
  });
};

// File upload hook
export const useFileUpload = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  onProgress?: (progress: number) => void;
}) => {
  return useMutation({
    mutationFn: async ({ file, endpoint }: { file: File; endpoint: string }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options?.onProgress?.(progress);
          }
        },
      });

      return response.data;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export { apiClient };
export default apiClient;