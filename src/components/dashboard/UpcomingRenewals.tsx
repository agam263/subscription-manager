import { useTranslation } from "react-i18next"
import { CalendarIcon, Radar } from "lucide-react"
import { Subscription } from "@/store/subscriptionStore"
import { formatDate, daysUntil } from "@/lib/subscription-utils"
import { formatWithUserCurrency } from "@/utils/currency"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"

interface UpcomingRenewalsProps {
  subscriptions: Subscription[]
  className?: string
}

export function UpcomingRenewals({ subscriptions, className }: UpcomingRenewalsProps) {
  const { t } = useTranslation('dashboard');

  const getBadgeVariant = (daysLeft: number) => {
    if (daysLeft <= 3) return "destructive"
    if (daysLeft <= 7) return "warning"
    return "secondary"
  }

  const getTimeLabel = (daysLeft: number) => {
    if (daysLeft === 0) return t('today')
    if (daysLeft === 1) return t('tomorrow')
    return `${daysLeft} ${t('days')}`
  }

  return (
    <AnimatedCard containerClassName={cn("min-h-[200px] flex flex-col", className)} className="flex flex-col p-6" glowColor="rgba(59, 130, 246, 0.4)">
      <div className="flex-shrink-0 mb-4 text-foreground">
        <h3 className="text-lg font-bold tracking-tight mb-1">{t('upcomingRenewals')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('subscriptionsRenewingInNext7Days')}
        </p>
      </div>
      <div className="flex-1 flex flex-col text-foreground">
        {subscriptions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Radar className="h-16 w-16 text-blue-400 animate-[spin_4s_linear_infinite] opacity-50 mb-4" />
            <p className="text-muted-foreground">Scanning for upcoming renewals...</p>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {subscriptions.map((subscription) => {
              const daysRemaining = daysUntil(subscription.nextBillingDate)
              return (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-col">
                    <div className="font-medium">{subscription.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.plan}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-medium">
                        {formatWithUserCurrency(subscription.amount, subscription.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDate(subscription.nextBillingDate)}
                      </div>
                    </div>
                    <Badge variant={getBadgeVariant(daysRemaining)} className="bg-foreground/5 hover:bg-foreground/10 text-foreground shadow-none border-transparent">
                      {getTimeLabel(daysRemaining)}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AnimatedCard>
  )
}