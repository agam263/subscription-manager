import { useTranslation } from "react-i18next";
import { HandCoins } from "lucide-react";
import { Subscription } from "@/store/subscriptionStore";
import { formatWithUserCurrency } from "@/utils/currency";
import { AnimatedCard } from "@/components/ui/animated-card";

import { cn } from "@/lib/utils";

interface RecentlyPaidProps {
  subscriptions: Subscription[];
  className?: string;
}

const getServiceColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('netflix')) return 'rgba(229, 9, 20, 0.6)';
  if (n.includes('spotify')) return 'rgba(30, 215, 96, 0.6)';
  if (n.includes('youtube')) return 'rgba(255, 0, 0, 0.6)';
  if (n.includes('apple')) return 'rgba(128, 128, 128, 0.6)';
  if (n.includes('amazon') || n.includes('prime')) return 'rgba(0, 168, 225, 0.6)';
  // default generated color
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return `hsla(${Math.abs(hash) % 360}, 70%, 50%, 0.6)`;
};

export function RecentlyPaid({ subscriptions, className }: RecentlyPaidProps) {
  const { t } = useTranslation('dashboard');

  return (
    <AnimatedCard containerClassName={cn("min-h-[200px] flex flex-col", className)} className="flex flex-col p-6" glowColor="rgba(236, 72, 153, 0.4)">
      <div className="flex-shrink-0 mb-4 text-foreground">
        <h3 className="text-lg font-bold tracking-tight mb-1">{t('recentlyPaid')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('subscriptionsPaidInLast7Days')}
        </p>
      </div>
      <div className="flex-1 flex flex-col">
        {subscriptions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <HandCoins className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{t('noSubscriptionsPaidInLast7Days')}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 flex-1">
            {subscriptions.map((subscription) => {
              const glowColor = getServiceColor(subscription.name);
              return (
                <div
                  key={subscription.id}
                  className="group relative flex items-center gap-3 bg-foreground/5 border border-border/50 rounded-full px-4 py-2 hover:bg-foreground/10 transition-colors cursor-default"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 shrink-0">
                    <div 
                      className="absolute inset-0 rounded-full blur-[10px] opacity-70 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: glowColor }}
                    ></div>
                    <span className="relative text-xs font-bold text-foreground z-10">
                      {subscription.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col pr-2 text-foreground">
                    <span className="text-sm font-semibold tracking-tight leading-tight">{subscription.name}</span>
                    <span className="text-xs text-muted-foreground font-medium">{formatWithUserCurrency(subscription.amount, subscription.currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
} 