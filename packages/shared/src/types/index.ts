// Shared TypeScript types

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RunFilters {
  status?: string;
  environment?: string;
  branch?: string;
  commit?: string;
  from?: string;
  to?: string;
  trigger?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalProjects: number;
  totalRunsThisMonth: number;
  passRate: number;
  failedRunsCount: number;
  flakyTestsCount: number;
  recentAlerts: number;
}

export interface ProjectStats {
  latestRunStatus: string | null;
  failureRate: number;
  flakeRate: number;
  totalRuns: number;
  totalTests: number;
  slowestTests: SlowTest[];
  recentFailures: RecentFailure[];
}

export interface SlowTest {
  testId: string;
  filePath: string;
  titlePath: string[];
  avgDurationMs: number;
  lastRunStatus: string;
}

export interface RecentFailure {
  runId: string;
  testId: string;
  testName: string;
  filePath: string;
  errorMessage: string;
  failedAt: string;
}
