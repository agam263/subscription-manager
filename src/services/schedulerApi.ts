import { apiClient } from '@/utils/api-client';

export interface SchedulerSettings {
  notification_check_time: string;
  timezone: string;
  is_enabled: boolean;
}

export interface SchedulerStatus {
  running: boolean;
  nextRun: boolean;
  settings: SchedulerSettings;
  currentSchedule: {
    time: string;
    timezone: string;
    enabled: boolean;
  } | null;
}

export const schedulerApi = {
  // Get scheduler settings
  getSettings: (): Promise<SchedulerSettings> =>
    apiClient.get<SchedulerSettings>('/scheduler/settings'),

  // Update scheduler settings
  updateSettings: (settings: Partial<SchedulerSettings>): Promise<{ message: string; settings: SchedulerSettings }> =>
    apiClient.put<{ message: string; settings: SchedulerSettings }>('/protected/scheduler/settings', settings),

  // Get scheduler status
  getStatus: (): Promise<SchedulerStatus> =>
    apiClient.get<SchedulerStatus>('/scheduler/status'),

  // Manually trigger notification checks
  triggerCheck: (): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/protected/scheduler/trigger', {})
};
