import { apiClient } from '@/utils/api-client';

export interface NotificationSetting {
  id: number;
  notification_type: string;
  is_enabled: boolean;
  advance_days: number;
  notification_channels: string[];
  repeat_notification: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannel {
  id: number;
  channel_type: string;
  channel_config: Record<string, unknown>;
  config?: Record<string, unknown>; // Parsed config object
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: number;
  subscription_id: number;
  notification_type: string;
  channel_type: string;
  status: string;
  recipient: string;
  message_content: string;
  error_message: string | null;
  retry_count: number;
  max_retry: number;
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
  subscription_name?: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  retrying: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
}

export interface TelegramBotInfo {
  id: number;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export interface TelegramConfigStatus {
  configured: boolean;
  hasToken: boolean;
  isPlaceholder: boolean;
}

export const notificationApi = {
  // Get notification settings
  getSettings: () =>
    apiClient.get<NotificationSetting[]>(`/protected/notifications/settings`),

  // Update notification settings
  updateSetting: (settingId: number, setting: Partial<NotificationSetting>) =>
    apiClient.put<{ message: string }>(`/protected/notifications/settings/${settingId}`, setting),

  // Configure notification channels
  configureChannel: (channelType: string, config: Record<string, unknown>) =>
    apiClient.post<{ message: string }>(`/protected/notifications/channels`, {
      channel_type: channelType,
      config
    }),

  // Get channel configuration
  getChannelConfig: (channelType: string) =>
    apiClient.get<NotificationChannel>(`/protected/notifications/channels/${channelType}`),

  // Test notification
  testNotification: (channelType: string) =>
    apiClient.post(`/protected/notifications/test`, {
      channel_type: channelType
    }),

  // Send notification
  sendNotification: (data: {
    subscription_id: number;
    notification_type: string;
    channels?: string[];
  }) =>
    apiClient.post(`/protected/notifications/send`, data),

  // Get notification calendar
  getHistory: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) => {
    let url = `/notifications/history`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return apiClient.get<{
      data: NotificationHistory[];
      pagination: {
        page: number;
        limit: number;
        total: number;
      };
    }>(url);
  },



  // Get notification statistics (public interface)
  getStats: () =>
    apiClient.get<NotificationStats>(`/notifications/stats`),

  // Verify Telegram Chat ID
  validateChatId: (chatId: string) =>
    apiClient.post(`/protected/notifications/validate-chat-id`, { chat_id: chatId }),

  // Get Telegram Bot information
  getBotInfo: () =>
    apiClient.get<{ success: boolean; botInfo: TelegramBotInfo }>(`/protected/notifications/telegram/bot-info`),

  // Get Telegram configuration status
  getTelegramConfigStatus: () =>
    apiClient.get<TelegramConfigStatus>(`/protected/notifications/telegram/config-status`)
};