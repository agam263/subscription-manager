import { useState, useEffect, useCallback } from "react"
import {
  Calendar,
  Clock,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next"
import { MagneticButton } from "@/components/ui/magnetic-button"
import LaserFlow from "@/components/LaserFlow"
import PixelSnow from "@/components/PixelSnow"

// Helper function to safely extract error message
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return String(error)
}


import {
  useSubscriptionStore,
  Subscription
} from "@/store/subscriptionStore"
import { useSettingsStore } from "@/store/settingsStore"
import { formatCurrencyAmount } from "@/utils/currency"
import { getCurrentMonthSpending, getCurrentYearSpending } from "@/lib/expense-analytics-api"

import { SubscriptionForm } from "@/components/subscription/SubscriptionForm"
import { StatCard } from "@/components/dashboard/StatCard"
import { UpcomingRenewals } from "@/components/dashboard/UpcomingRenewals"
import { RecentlyPaid } from "@/components/dashboard/RecentlyPaid"
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown"
import { ImportModal } from "@/components/imports/ImportModal"

function HomePage() {
  const { toast } = useToast()
  const { t } = useTranslation(['dashboard', 'common'])
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  // Get the default view from settings
  const { currency: userCurrency, fetchSettings } = useSettingsStore()
  
  const {
    subscriptions,
    bulkAddSubscriptions,
    updateSubscription,
    fetchSubscriptions,
    getUpcomingRenewals,
    getRecentlyPaid,
    getSpendingByCategory,
    initializeData,
    initializeWithRenewals,
    isLoading
  } = useSubscriptionStore()

  // State for API-based spending data
  const [monthlySpending, setMonthlySpending] = useState<number>(0)
  const [yearlySpending, setYearlySpending] = useState<number>(0)
  const [isLoadingSpending, setIsLoadingSpending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Initialize subscriptions without auto-renewals
  const initialize = useCallback(async () => {
    await fetchSettings()
    await initializeData()
  }, [fetchSettings, initializeData])

  useEffect(() => {
    initialize()
  }, [initialize])

  // Load spending data from API
  useEffect(() => {
    const loadSpendingData = async () => {
      setIsLoadingSpending(true)

      try {
        const [currentMonth, currentYear] = await Promise.all([
          getCurrentMonthSpending(userCurrency),
          getCurrentYearSpending(userCurrency)
        ])

        setMonthlySpending(currentMonth)
        setYearlySpending(currentYear)
      } catch (error) {
        console.error('Failed to load spending data:', error)
      } finally {
        setIsLoadingSpending(false)
      }
    }

    if (userCurrency) {
      loadSpendingData()
    }
  }, [userCurrency])

  // Handler for updating subscription
  const handleUpdateSubscription = async (id: number, data: Omit<Subscription, "id" | "lastBillingDate">) => {
    const { error } = await updateSubscription(id, data)

    if (error) {
      toast({
        title: t('subscription:errorUpdate') || "Error updating subscription",
        description: getErrorMessage(error) || "Failed to update subscription",
        variant: "destructive"
      })
      return
    }

    setEditingSubscription(null)
    toast({
      title: t('subscription.updated') || "Subscription updated",
      description: `${data.name} ${t('subscription.updateSuccess') || "has been updated successfully."}`
    })
  }

  // Handler for manual refresh with renewals
  const handleRefreshWithRenewals = async () => {
    setIsRefreshing(true)
    try {
      await initializeWithRenewals()

      // Also refresh spending data
      if (userCurrency) {
        const [currentMonth, currentYear] = await Promise.all([
          getCurrentMonthSpending(userCurrency),
          getCurrentYearSpending(userCurrency)
        ])
        setMonthlySpending(currentMonth)
        setYearlySpending(currentYear)
      }

      toast({
        title: t('dataRefreshed') || "Data refreshed",
        description: t('dataRefreshedDesc') || "Subscription data and renewals have been processed."
      })
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast({
        title: t('common:refreshFailed') || "Refresh failed",
        description: t('common:refreshFailedDesc') || "Failed to refresh data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }



  // Handler for importing subscriptions
  const handleImportSubscriptions = async (newSubscriptions: Omit<Subscription, "id">[]) => {
    const { error } = await bulkAddSubscriptions(newSubscriptions);

    if (error) {
      toast({
        title: t('subscription:importFailed') || "Import failed",
        description: getErrorMessage(error) ||  "Failed to import subscriptions",
        variant: "destructive",
      });
    } else {
      toast({
        title: t('subscription:importSuccess') || "Import successful",
        description: `${newSubscriptions.length} ${t('common:subscriptions')} ${t('common:importSuccess') || "have been imported."}`,
      });
    }

    // Final fetch to ensure UI is up-to-date
    fetchSubscriptions();
  };



  // Get data for dashboard (non-API data)
  const upcomingRenewals = getUpcomingRenewals(7)
  const recentlyPaidSubscriptions = getRecentlyPaid(7)
  const spendingByCategory = getSpendingByCategory()

  if (isLoading || isLoadingSpending) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">{t('common:loading')} {t('common:subscriptions')}...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
        <PixelSnow
          color="#ffffff"
          flakeSize={0.01}
          minFlakeSize={1.25}
          pixelResolution={200}
          speed={1.25}
          depthFade={8}
          farPlane={20}
          brightness={1}
          gamma={0.4545}
          density={0.3}
          variant="square"
          direction={125}
        />
      </div>

      <div className="relative z-10">
        {/* Immersive Dashboard Header */}
      <div className="relative w-full h-[260px] flex items-center justify-center overflow-hidden rounded-[16px] mb-8 bg-black">
        <div className="absolute inset-0 z-0">
          <LaserFlow
            color="#3B82F6"
            wispDensity={1.4}
            flowSpeed={0.35}
            verticalSizing={2.2}
            horizontalSizing={2}
            fogIntensity={0.35}
            glowIntensity={0.6}
            noiseScale={0.9}
            distortion={0.4}
            backgroundColor="#000000"
          />
        </div>

        <MagneticButton
          onClick={handleRefreshWithRenewals}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="absolute top-6 right-6 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-white/10 text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? t('common:refreshing') : t('common:refresh')}
        </MagneticButton>

        <div className="absolute z-10 text-center text-white pointer-events-none">
          <h1 className="text-[42px] font-bold mb-2 tracking-[-0.5px] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
            {t('common:dashboard')}
          </h1>
          <p className="text-[16px] text-gray-400 max-w-sm mx-auto">
            {t('common:dashboardDescription')}
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title={t('common:monthlySpending')}
              value={formatCurrencyAmount(monthlySpending, userCurrency)}
              description={t('common:currentMonthExpenses')}
              icon={Calendar}
              iconColor="text-blue-500"
              className="shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:shadow-[0_0_20px_rgba(59,130,246,0.25)] border-blue-500/20 transition-all duration-300"
            />
            <StatCard
              title={t('common:yearlySpending')}
              value={formatCurrencyAmount(yearlySpending, userCurrency)}
              description={t('common:currentYearTotal')}
              icon={Calendar}
              iconColor="text-purple-500"
            />
            <StatCard
              title={t('common:activeSubscriptions')}
              value={subscriptions.filter(sub => sub.status === "active").length}
              description={t('common:totalServices')}
              icon={Clock}
              iconColor="text-green-500"
            />
          </div>
          
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <RecentlyPaid
              subscriptions={recentlyPaidSubscriptions}
            />

            <UpcomingRenewals
              subscriptions={upcomingRenewals}
            />

            <CategoryBreakdown data={spendingByCategory} />
          </div>
        </div>



      {/* Forms and Modals */}
      {editingSubscription && (
        <SubscriptionForm
          open={Boolean(editingSubscription)}
          onOpenChange={() => setEditingSubscription(null)}
          initialData={editingSubscription}
          onSubmit={(data) => handleUpdateSubscription(editingSubscription.id, data)}
        />
      )}
      
        <ImportModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          onImport={handleImportSubscriptions}
        />
      </div>
    </>
  )
}

export default HomePage