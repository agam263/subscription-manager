import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Notification channel configuration type
export interface NotificationChannelConfig {
  telegram?: {
    chat_id: string;
    validated?: boolean;
    lastValidated?: string;
  };
  email?: {
    email: string;
    validated?: boolean;
    lastValidated?: string;
  };
}

// Notification configuration status
interface NotificationConfigState {
  // Channel configuration (local cache)
  channelConfigs: NotificationChannelConfig;
  
  // How to operate
  setTelegramConfig: (config: { chat_id: string; validated?: boolean }) => void;
  setEmailConfig: (config: { email: string; validated?: boolean }) => void;
  clearChannelConfig: (channel: 'telegram' | 'email') => void;
  clearAllConfigs: () => void;
  
  // Verification status management
  setChannelValidated: (channel: 'telegram' | 'email', validated: boolean) => void;
}

const initialState = {
  channelConfigs: {},
};

export const useNotificationStore = create<NotificationConfigState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setTelegramConfig: (config) => {
        set((state) => ({
          channelConfigs: {
            ...state.channelConfigs,
            telegram: {
              ...state.channelConfigs.telegram,
              chat_id: config.chat_id,
              validated: config.validated ?? state.channelConfigs.telegram?.validated,
              lastValidated: config.validated ? new Date().toISOString() : state.channelConfigs.telegram?.lastValidated,
            },
          },
        }));
      },
      
      setEmailConfig: (config) => {
        set((state) => ({
          channelConfigs: {
            ...state.channelConfigs,
            email: {
              ...state.channelConfigs.email,
              email: config.email,
              validated: config.validated ?? state.channelConfigs.email?.validated,
              lastValidated: config.validated ? new Date().toISOString() : state.channelConfigs.email?.lastValidated,
            },
          },
        }));
      },
      
      clearChannelConfig: (channel) => {
        set((state) => {
          const newConfigs = { ...state.channelConfigs };
          delete newConfigs[channel];
          return { channelConfigs: newConfigs };
        });
      },
      
      clearAllConfigs: () => {
        set({ channelConfigs: {} });
      },
      
      setChannelValidated: (channel, validated) => {
        set((state) => {
          const currentConfig = state.channelConfigs[channel];
          if (!currentConfig) return state;
          
          return {
            channelConfigs: {
              ...state.channelConfigs,
              [channel]: {
                ...currentConfig,
                validated,
                lastValidated: validated ? new Date().toISOString() : currentConfig.lastValidated,
              },
            },
          };
        });
      },
    }),
    {
      name: 'notification-config-storage',
      // Only persist configuration data
      partialize: (state) => ({
        channelConfigs: state.channelConfigs,
      }),
    }
  )
);
