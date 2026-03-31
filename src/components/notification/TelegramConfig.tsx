import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Send, Check, X, MessageCircle, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '@/services/notificationApi';
import { useToast } from '@/hooks/use-toast';
import { useNotificationStore } from '@/store/notificationStore';

interface TelegramConfigProps {
  userId: number;
  onConfigChange?: () => void;
}

interface TelegramConfigData {
  chat_id: string;
}

interface BotConfig {
  configured: boolean;
  hasToken: boolean;
  isPlaceholder: boolean;
}

interface BotInfo {
  id: number;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

interface ApiResponse {
  response?: { status?: number };
}

interface ConfigResponse {
  config?: TelegramConfigData;
}

interface ValidationResponse {
  success?: boolean;
  error?: string;
}

interface BotInfoResponse {
  success?: boolean;
  botInfo?: BotInfo;
}

export const TelegramConfig: React.FC<TelegramConfigProps> = ({ userId, onConfigChange }) => {
  const { t } = useTranslation('notification');
  const { toast } = useToast();

  // Use local storage
  const {
    channelConfigs,
    setTelegramConfig,
    setChannelValidated
  } = useNotificationStore();

  const [config, setConfig] = useState<TelegramConfigData>({
    chat_id: channelConfigs.telegram?.chat_id || ''
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [chatIdValid, setChatIdValid] = useState<boolean | null>(
    channelConfigs.telegram?.validated ?? null
  );
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getChannelConfig('telegram');
      if (response) {
        // Configuration structure returned by the backend: { id, channel_type, channel_config, config, is_active, ... }
        // The config field is the parsed JSON object, and channel_config is the original JSON string.
        const configData = (response as unknown as ConfigResponse).config || {};
        const chatId = (configData as TelegramConfigData).chat_id || '';

        // Update local state and local storage
        setConfig({ chat_id: chatId });
        setTelegramConfig({ chat_id: chatId });
      }
    } catch (error) {
      console.error('Failed to load Telegram config:', error);
      // If the configuration does not exist (404 error), reset to an empty configuration
      if ((error as ApiResponse).response?.status === 404) {
        setConfig({ chat_id: '' });
      }
    } finally {
      setLoading(false);
    }
  }, [setTelegramConfig]);

  const loadBotInfo = useCallback(async () => {
    try {
      const [configStatus, botInfoResponse] = await Promise.all([
        notificationApi.getTelegramConfigStatus(),
        notificationApi.getBotInfo()
      ]);

      // The API client already extracts the data field, so configStatus and botInfoResponse are the data directly
      setBotConfig(configStatus || { configured: false, hasToken: false, isPlaceholder: true });
      setBotInfo((botInfoResponse as BotInfoResponse)?.success ? (botInfoResponse as BotInfoResponse).botInfo || null : null);
    } catch (error) {
      console.error('Failed to load bot info:', error);
      // Set default values on error
      setBotConfig({ configured: false, hasToken: false, isPlaceholder: true });
      setBotInfo(null);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadBotInfo();
  }, [userId, loadConfig, loadBotInfo]);

  const validateChatId = async (chatId: string) => {
    if (!chatId.trim()) {
      setChatIdValid(null);
      setChannelValidated('telegram', false);
      return;
    }

    try {
      setValidating(true);
      const response = await notificationApi.validateChatId(chatId);
      // The API client already extracts the data field, so response is the data directly
      const isValid = (response as ValidationResponse)?.success || false;
      setChatIdValid(isValid);
      setChannelValidated('telegram', isValid);

      if (isValid) {
        toast({
          title: t('chatIdValid'),
          description: t('chatIdValid'),
        });
      } else {
        toast({
          title: t('chatIdInvalid'),
          description: (response as ValidationResponse)?.error || t('chatIdInvalid'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to validate Chat ID:', error);
      setChatIdValid(false);
      setChannelValidated('telegram', false);
      toast({
        title: t('chatIdInvalid'),
        description: t('chatIdHelp'),
        variant: 'destructive'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const newChatId = config.chat_id.trim();

      // Save to local storage first
      setTelegramConfig({
        chat_id: newChatId,
        validated: newChatId ? (chatIdValid ?? false) : false
      });

      // and then save to the server
      await notificationApi.configureChannel('telegram', { chat_id: newChatId });

      // Reload the configuration to ensure the latest saved data is displayed
      await loadConfig();
      await loadBotInfo();

      toast({
        title: t('telegramConfigSaved'),
        description: newChatId ? t('channelConfigured') : t('chatIdCleared', 'Telegram chat ID cleared successfully.'),
      });
      onConfigChange?.();
    } catch (error) {
      console.error('Failed to save Telegram config:', error);
      toast({
        title: t('telegramConfigError'),
        description: t('errors.configSaveFailed'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.chat_id.trim()) {
      toast({
        title: t('errors.invalidChatId'),
        description: t('chatIdHelp'),
        variant: 'destructive'
      });
      return;
    }

    try {
      setTesting(true);
      await notificationApi.testNotification('telegram');
      toast({
        title: t('testSuccess'),
        description: t('testSuccess'),
      });
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      toast({
        title: t('testFailed', 'Failed to send test notification'),
        description: error?.message || t('errors.sendFailed', 'Send failed'),
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleChatIdChange = (value: string) => {
    setConfig(prev => ({ ...prev, chat_id: value }));
    setChatIdValid(null);
    // Update local storage in real time
    setTelegramConfig({ chat_id: value, validated: false });
    setChannelValidated('telegram', false);
  };

  const getStatusBadge = () => {
    if (!botConfig) {
      return <Badge variant="secondary">{t('notConfigured')}</Badge>;
    }
    
    if (botConfig.configured) {
      return <Badge variant="default" className="bg-green-500">{t('configured')}</Badge>;
    } else {
      return <Badge variant="destructive">{t('notConfigured')}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {t('telegram')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bot Info */}
        {botInfo && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>{t('botName')}:</strong> {botInfo.first_name}</div>
                <div><strong>{t('botUsername')}:</strong> @{botInfo.username}</div>
                <div><strong>{t('botStatus')}:</strong> {getStatusBadge()}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Warning */}
        {botConfig && !botConfig.configured && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
              {t('errors.telegramNotConfigured')}
            </AlertDescription>
          </Alert>
        )}

        {/* Chat ID Input */}
        <div className="space-y-2">
          <Label htmlFor="chat-id">{t('chatId')}</Label>
          <div className="flex gap-2">
            <Input
              id="chat-id"
              value={config.chat_id || ""}
              onChange={(e) => handleChatIdChange(e.target.value)}
              placeholder="123456789"
            />
            <Button
              variant="outline"
              onClick={() => validateChatId(config.chat_id)}
              disabled={validating || !config.chat_id.trim()}
            >
              {validating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('validateChatId')
              )}
            </Button>
          </div>
          
          {/* Chat ID Validation Status */}
          {chatIdValid !== null && (
            <div className="flex items-center gap-2 text-sm">
              {chatIdValid ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">{t('chatIdValid')}</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">{t('chatIdInvalid')}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="text-xs whitespace-pre-line">
            {t('chatIdHelp')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t('save')}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTest} 
            disabled={testing || loading || !config.chat_id.trim() || chatIdValid === false}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t('test')}
          </Button>
        </div>


      </CardContent>
    </Card>
  );
};