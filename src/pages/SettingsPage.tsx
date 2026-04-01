import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { Download, Upload, Shield, Key, Lock, CheckCircle2, AlertCircle, Database, LayoutList, Trash2 } from "lucide-react"

import { Subscription } from "@/store/subscriptionStore"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { ResetDataModal } from "@/components/settings/ResetDataModal"

import { useSettingsStore, ThemeType } from "@/store/settingsStore"
import { ImportModal } from "@/components/imports/ImportModal"
import { useSubscriptionStore } from "@/store/subscriptionStore"
import {
  exportSubscriptionsToJSON,
  downloadFile,
} from "@/lib/subscription-utils"
import { ExchangeRateManager } from "@/components/ExchangeRateManager"
import { OptionsManager } from "@/components/subscription/OptionsManager"
import { NotificationSettings } from "@/components/notification/NotificationSettings"
import { GeneralSettings } from "@/components/settings/GeneralSettings"
import { useTheme } from "next-themes"
import { useAuthStore } from "@/store/authStore"

export function SettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  const [searchParams] = useSearchParams()

  const { toast } = useToast()
  const changePassword = useAuthStore((state) => state.changePassword)
  const isAuthLoading = useAuthStore((state) => state.isLoading)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  const defaultTab = searchParams.get('tab') || 'general'

  const { setTheme: setNextTheme } = useTheme()

  const {
    theme,
    setTheme,
    resetSettings,
    isLoading,
    fetchSettings,
  } = useSettingsStore()

  const { subscriptions, resetSubscriptions, addSubscription, bulkAddSubscriptions, setupDefaultSubscriptions } = useSubscriptionStore()

  const initializeSettings = useCallback(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    initializeSettings()
  }, [initializeSettings])

  const getPasswordErrorMessage = (code?: string, fallback?: string) => {
    switch (code) {
      case 'CURRENT_PASSWORD_INVALID':
        return t('currentPasswordInvalid')
      case 'PASSWORDS_DO_NOT_MATCH':
        return t('passwordsDoNotMatch')
      case 'PASSWORD_COMPLEXITY_FAILED':
        return t('passwordValidationFailed')
      case 'PASSWORD_SAME_AS_OLD':
        return t('passwordMustDiffer')
      case 'MISSING_FIELDS':
        return t('passwordUpdateFailed')
      default:
        return fallback ?? t('passwordUpdateFailed')
    }
  }

  const validatePasswordForm = () => {
    if (!currentPassword || !newPassword) {
      setPasswordSuccess(null)
      setPasswordError(t('passwordUpdateFailed'))
      return false
    }

    if (newPassword !== confirmPassword) {
      setPasswordSuccess(null)
      setPasswordError(t('passwordsDoNotMatch'))
      return false
    }

    const rule = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
    if (!rule.test(newPassword)) {
      setPasswordSuccess(null)
      setPasswordError(t('passwordValidationFailed'))
      return false
    }

    if (currentPassword === newPassword) {
      setPasswordSuccess(null)
      setPasswordError(t('passwordMustDiffer'))
      return false
    }

    setPasswordError(null)
    return true
  }

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validatePasswordForm()) {
      return
    }

    setIsSubmittingPassword(true)
    const result = await changePassword(currentPassword, newPassword, confirmPassword)
    setIsSubmittingPassword(false)

    if (result.ok) {
      const successMessage = result.message ?? t('passwordUpdated')
      toast({ description: successMessage })
      setPasswordError(null)
      setPasswordSuccess(successMessage)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      const errorMessage = getPasswordErrorMessage(result.code, result.error)
      setPasswordSuccess(null)
      setPasswordError(errorMessage)
    }
  }

  // Handle data export
  const handleExportData = () => {
    const data = exportSubscriptionsToJSON(subscriptions)
    downloadFile(data, "subscriptions.json", "application/json")
  }

  // Handle imports
  const handleImportData = (subscriptionData: unknown[]) => {
    subscriptionData.forEach((sub) => {
      // Type guard to ensure sub has the required properties
      if (sub && typeof sub === 'object' && 'name' in sub) {
        addSubscription(sub as Omit<Subscription, "id" | "lastBillingDate">)
      }
    })
  }

  // Handle data reset with confirmation
  const handleResetData = async () => {
    await resetSubscriptions()
    await resetSettings()
    window.location.reload()
  }

  // Handle default subscription setup
  const handleSetupDefaultSubscriptions = async () => {
    const result = await setupDefaultSubscriptions();
    if (!result.error) {
      if (result.added > 0) {
         toast({ description: "Default subscriptions added successfully" });
      } else {
         toast({ description: "Default subscriptions already exist" });
      }
    } else {
       toast({ description: "Failed to add default subscriptions", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">{t('loadingSettings')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page-wrapper">
      <style>{`
        .settings-page-wrapper [data-card] {
          background-color: hsl(var(--card)) !important;
          backdrop-filter: none !important;
          border: 1px solid hsl(var(--border)) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
          border-radius: var(--radius) !important;
        }
      `}</style>

      <div className="flex items-center justify-between pb-4 relative z-10 bg-background/80 p-4 rounded-xl backdrop-blur-md mb-6 border border-border/50">
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </div>

      <Tabs defaultValue={defaultTab}>
        <div className="overflow-x-auto mb-4 sm:overflow-visible">
          <TabsList className="mb-4 min-w-max sm:min-w-0">
            <TabsTrigger value="general" className="text-xs sm:text-sm px-2 sm:px-3">{t('general')}</TabsTrigger>
            <TabsTrigger value="currency" className="text-xs sm:text-sm px-2 sm:px-3">{t('currency')}</TabsTrigger>
            <TabsTrigger value="options" className="text-xs sm:text-sm px-2 sm:px-3">{t('options')}</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 sm:px-3">{t('notifications')}</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm px-2 sm:px-3">{t('security')}</TabsTrigger>
            <TabsTrigger value="data" className="text-xs sm:text-sm px-2 sm:px-3">{t('data')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-4">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <ExchangeRateManager />
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <OptionsManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings userId={1} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none rounded-xl" />
          <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-lg relative overflow-hidden group transition-all duration-500 hover:shadow-primary/5 hover:border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <CardHeader className="space-y-1 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="tracking-tight text-xl">{t('changePassword')}</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1.5">{t('changePasswordDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <form onSubmit={handleChangePassword} className="relative z-10">
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    {t('currentPassword')}
                  </Label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover/input:opacity-100 transition-opacity rounded-md -z-10 blur-sm" />
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      autoComplete="current-password"
                      className="bg-background/50 border-white/10 focus-visible:ring-primary/50 transition-all duration-300 placeholder:text-muted-foreground/50 h-11"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      {t('newPassword')}
                    </Label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover/input:opacity-100 transition-opacity rounded-md -z-10 blur-sm" />
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        className="bg-background/50 border-white/10 focus-visible:ring-primary/50 transition-all duration-300 placeholder:text-muted-foreground/50 h-11"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      {t('confirmNewPassword')}
                    </Label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover/input:opacity-100 transition-opacity rounded-md -z-10 blur-sm" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        className="bg-background/50 border-white/10 focus-visible:ring-primary/50 transition-all duration-300 placeholder:text-muted-foreground/50 h-11"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-4 border border-border/40 backdrop-blur-sm">
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{t('passwordRules')}</span>
                  </p>
                </div>

                {passwordError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm font-medium" role="alert">{passwordError}</p>
                  </div>
                )}
                {passwordSuccess && !passwordError && (
                  <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-500 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <p className="text-sm font-medium" role="status">{passwordSuccess}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-4 sm:flex-row sm:justify-end pt-2 pb-6 px-6 relative z-10 border-t border-border/10 mt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmittingPassword || isAuthLoading}
                  className="w-full sm:w-auto min-w-[140px] shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 group active:scale-95"
                >
                  <Shield className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                  {isSubmittingPassword || isAuthLoading ? t('signingIn', { ns: 'auth' }) : t('changePassword')}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-destructive/5 pointer-events-none rounded-xl" />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-lg relative overflow-hidden group transition-all duration-500 hover:shadow-primary/5 hover:border-primary/20 md:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="space-y-1 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <LayoutList className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="tracking-tight text-xl">Subscription Workflow</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1.5">
                      Automatically set up default region-localized subscriptions.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 pt-2 pb-6">
                <Button 
                  onClick={handleSetupDefaultSubscriptions} 
                  className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 group/btn active:scale-95 w-full sm:w-auto"
                >
                  <LayoutList className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                  Setup Default Subscriptions
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-lg relative overflow-hidden group transition-all duration-500 hover:shadow-primary/5 hover:border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="space-y-1 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="tracking-tight text-xl">{t('dataManagement')}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1.5">
                      {t('exportImportDesc')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 relative z-10 pt-2 pb-6">
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  className="w-full sm:w-auto bg-background/50 border-white/10 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('exportData')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full sm:w-auto bg-background/50 border-white/10 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('importData')}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-background/60 backdrop-blur-xl shadow-lg relative overflow-hidden group transition-all duration-500 hover:shadow-destructive/5 hover:border-destructive/40">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="space-y-1 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-destructive/10 ring-1 ring-destructive/20">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="tracking-tight text-xl text-destructive">{t('resetData')}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1.5">
                      {t('resetDataDesc')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 pt-2 pb-6">
                <Button 
                  variant="destructive" 
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full sm:w-auto shadow-lg shadow-destructive/20 transition-all hover:shadow-destructive/40 group/btn active:scale-95"
                >
                  <Trash2 className="w-4 h-4 mr-2 group-hover/btn:animate-bounce" />
                  {t('resetAllData')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
      
      <ImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImportData}
      />
      
      {/* Reset Confirmation Dialog */}
      <ResetDataModal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetComplete={handleResetData}
      />
    </div>
  )
}
