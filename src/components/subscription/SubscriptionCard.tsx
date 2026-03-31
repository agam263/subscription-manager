import { useTranslation } from "react-i18next"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"
import {
  Calendar,
  CreditCard,
  MoreVertical,
  Pencil,
  Trash2,
  Ban,
  Tag,
  RotateCcw,
  Hand
} from "lucide-react"

import { Subscription, useSubscriptionStore } from "@/store/subscriptionStore"
import {
  formatDate,
  daysUntil,
  getBillingCycleLabel,
  getCategoryLabel,
  getPaymentMethodLabel
} from "@/lib/subscription-utils"
import { formatWithUserCurrency } from "@/utils/currency"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SubscriptionCardProps {
  subscription: Subscription
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onStatusChange: (id: number, status: 'active' | 'cancelled') => void
  onViewDetails?: (subscription: Subscription) => void
}

const getServiceColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('netflix')) return 'rgba(229, 9, 20, 1)';
  if (n.includes('spotify')) return 'rgba(30, 215, 96, 1)';
  if (n.includes('youtube')) return 'rgba(255, 0, 0, 1)';
  if (n.includes('apple')) return 'rgba(128, 128, 128, 1)';
  if (n.includes('amazon') || n.includes('prime')) return 'rgba(0, 168, 225, 1)';
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return `hsla(${Math.abs(hash) % 360}, 80%, 60%, 1)`;
};

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails
}: SubscriptionCardProps) {
  const {
    id,
    name,
    plan,
    amount,
    currency,
    nextBillingDate,
    billingCycle,
    status,
    renewalType
  } = subscription

  // Get options from the store
  const { categories, paymentMethods } = useSubscriptionStore()
  const { t } = useTranslation(['common', 'subscription'])

  // Get the category and payment method labels using unified utility functions
  const categoryLabel = getCategoryLabel(subscription, categories)
  const paymentMethodLabel = getPaymentMethodLabel(subscription, paymentMethods)

  const daysLeft = daysUntil(nextBillingDate)
  const isExpiringSoon = daysLeft <= 7

  // Helper function to determine badge color based on urgency
  const getBadgeVariant = () => {
    if (status === 'cancelled') return "secondary"
    if (daysLeft <= 3) return "destructive"
    if (daysLeft <= 7) return "warning"
    return "secondary"
  }

  // 3D Tilt Logic
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const brandColor = getServiceColor(name);

  return (
    <motion.div
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className="w-full h-full cursor-pointer group"
      onClick={() => onViewDetails?.(subscription)}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col h-full rounded-[24px] bg-white/40 dark:bg-[rgba(255,255,255,0.03)] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-shadow hover:shadow-md dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        {/* 1px Stroke Linear Gradient */}
        <div 
          className="absolute inset-0 rounded-[24px] p-[1px] bg-gradient-to-br from-black/5 via-black/5 dark:from-white/20 dark:via-white/5 to-transparent pointer-events-none" 
          style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}
        ></div>

        {/* Brand Glow Background */}
        <div 
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] opacity-30 mix-blend-screen pointer-events-none group-hover:opacity-60 transition-opacity duration-700"
          style={{ backgroundColor: brandColor }}
        ></div>

        {/* Card Content Wrapper */}
        <div className="relative z-10 flex flex-col flex-1 p-6">
          <div className="flex flex-row items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold tracking-tight text-foreground drop-shadow-sm">{name}</h3>
                <Badge variant={status === 'active' ? 'default' : 'secondary'} className="bg-foreground/5 hover:bg-foreground/10 backdrop-blur-md border-transparent text-foreground shadow-none">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{plan}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('common:options')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/90 backdrop-blur-xl border-border">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit(id)
                }} className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common:edit')}
                </DropdownMenuItem>
                {status === 'active' ? (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(id, 'cancelled')
                  }} className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">
                    <Ban className="mr-2 h-4 w-4" />
                    {t('subscription:cancelled')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(id, 'active')
                  }} className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    {t('subscription:active')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(id)
                  }}
                  className="text-red-500 hover:bg-foreground/10 focus:bg-foreground/10 focus:text-red-600 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common:delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex-1 flex flex-col justify-end mt-4">
            <div className="flex justify-between items-center mb-6">
              <div className="font-mono text-3xl font-bold tracking-tighter text-foreground drop-shadow-sm dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]">
                {formatWithUserCurrency(amount, currency)}
              </div>
              <Badge variant="outline" className="rounded-full bg-foreground/5 border-border backdrop-blur-md px-3 py-1 font-medium tracking-wide shadow-none text-foreground/90">
                {getBillingCycleLabel(billingCycle)}
              </Badge>
            </div>
            
            <div className="space-y-3 text-sm pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Tag className="h-4 w-4 shrink-0" />
                <span className="font-medium truncate">{categoryLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{t('subscription:nextPayment')}:</span>
                  <span className={isExpiringSoon ? "text-red-500 font-bold" : "text-foreground font-medium"}>
                    {formatDate(nextBillingDate)}
                  </span>
                  {isExpiringSoon && status === 'active' && (
                    <Badge variant={getBadgeVariant()} className="shadow-none scale-90 origin-left">
                      {daysLeft === 0 ? t('common:today') : `${daysLeft} ${t('common:days')}`}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span className="truncate">{paymentMethodLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                {renewalType === 'auto' ? (
                  <RotateCcw className="h-4 w-4 shrink-0" />
                ) : (
                  <Hand className="h-4 w-4 shrink-0" />
                )}
                <span>{renewalType === 'auto' ? t('common:automaticRenewal') : t('common:manualRenewal')}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}