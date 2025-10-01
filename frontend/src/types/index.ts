// Core data interfaces
export interface Job {
  id: string;
  kind: 'training' | 'evaluation' | 'merge' | 'inference';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  parameters: Record<string, any>;
  logs: LogEntry[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source?: string;
}

export interface Adapter {
  id: string;
  name: string;
  path: string;
  description?: string;
  trainingDate?: string;
  baseModel: string;
  metrics?: EvaluationMetrics;
}

export interface TrainingParameters {
  modelName: string;
  datasetPath: string;
  outputDir: string;
  numTrainEpochs: number;
  learningRate: number;
  batchSize: number;
  gradientAccumulation: number;
  loraRank: number;
  loraAlpha: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  loss: number;
  perplexity: number;
  bleuScore?: number;
  customMetrics?: Record<string, number>;
}

// UI State interfaces
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    jobComplete: boolean;
    errors: boolean;
    updates: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
}

export interface LayoutState {
  sidebarCollapsed: boolean;
  activeRoute: string;
  breadcrumbs: BreadcrumbItem[];
  pageTitle: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Store interfaces
export interface AppStore {
  theme: 'light' | 'dark' | 'system';
  apiStatus: 'online' | 'offline' | 'checking';
  notifications: Notification[];
  user: UserProfile | null;
}

export interface JobStore {
  jobs: Job[];
  activeJob: Job | null;
  logs: LogEntry[];
  filters: JobFilters;
}

export interface ModelStore {
  adapters: Adapter[];
  selectedModel: string;
  trainingParams: TrainingParameters;
}

export interface JobFilters {
  status?: Job['status'][];
  kind?: Job['kind'][];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  duration?: number;
}

// Component prop interfaces
export interface ComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Chart data types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartDataPoint[];
  options?: Record<string, any>;
}
