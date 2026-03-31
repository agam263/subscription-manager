import { useState } from 'react'
import { motion } from "framer-motion"
import { formatCurrencyAmount } from "@/utils/currency"
import { Calendar, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { ExpenseDetailDialog } from "./ExpenseDetailDialog"

export interface ExpenseInfoData {
  period: string
  periodType: 'monthly' | 'quarterly' | 'yearly'
  totalSpent: number
  dailyAverage: number
  activeSubscriptions: number
  paymentCount: number
  startDate: string
  endDate: string
  currency: string
}

interface ExpenseInfoCardsProps {
  monthlyData: ExpenseInfoData[]
  quarterlyData: ExpenseInfoData[]
  yearlyData: ExpenseInfoData[]
  currency: string
  isLoading?: boolean
  className?: string
}

export function ExpenseInfoCards({
  monthlyData,
  quarterlyData,
  yearlyData,
  currency,
  isLoading = false,
  className = ''
}: ExpenseInfoCardsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ExpenseInfoData | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const handleViewDetails = (data: ExpenseInfoData) => {
    setSelectedPeriod(data)
    setIsDetailDialogOpen(true)
  }

  const currentMonthly = monthlyData?.[monthlyData.length - 1]
  const prevMonthly = monthlyData?.[monthlyData.length - 2]
  const currentQuarterly = quarterlyData?.[quarterlyData.length - 1]
  const prevQuarterly = quarterlyData?.[quarterlyData.length - 2]
  const currentYearly = yearlyData?.[yearlyData.length - 1]
  const prevYearly = yearlyData?.[yearlyData.length - 2]

  const calculateTrend = (current?: ExpenseInfoData, prev?: ExpenseInfoData) => {
    if (!current || !prev || prev.totalSpent === 0) return null;
    const diff = current.totalSpent - prev.totalSpent;
    const percent = (diff / prev.totalSpent) * 100;
    return {
      value: Math.abs(percent).toFixed(1),
      isUp: percent > 0,
      isDown: percent < 0,
    }
  }

  const trends = {
    monthly: calculateTrend(currentMonthly, prevMonthly),
    quarterly: calculateTrend(currentQuarterly, prevQuarterly),
    yearly: calculateTrend(currentYearly, prevYearly),
  }

  const metrics = [
    { title: "Monthly Expense", data: currentMonthly, trend: trends.monthly, icon: Calendar, color: "text-blue-400", glow: "rgba(59,130,246,0.5)", bg: "from-blue-500/10 to-transparent" },
    { title: "Quarterly Expense", data: currentQuarterly, trend: trends.quarterly, icon: TrendingUp, color: "text-emerald-400", glow: "rgba(52,211,153,0.5)", bg: "from-emerald-500/10 to-transparent" },
    { title: "Yearly Expense", data: currentYearly, trend: trends.yearly, icon: Clock, color: "text-purple-400", glow: "rgba(168,85,247,0.5)", bg: "from-purple-500/10 to-transparent" },
  ]

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 relative z-10 w-full ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col p-5 lg:p-6 rounded-[24px] bg-background/50 dark:bg-white/[0.02] backdrop-blur-xl border border-border/50 dark:border-white/5 overflow-hidden animate-pulse h-[140px] lg:h-[160px]">
            <div className="h-4 bg-muted dark:bg-white/10 rounded w-1/3 mb-auto"></div>
            <div className="h-8 bg-muted dark:bg-white/10 rounded w-2/3 mt-auto"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 relative z-10 w-full ${className}`}>
      {metrics.map((m, i) => (
        <motion.div
          key={i}
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative flex flex-col p-5 lg:p-6 rounded-[24px] bg-gradient-to-b from-background/50 dark:from-white/[0.04] to-transparent backdrop-blur-xl border border-border/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:border-border dark:hover:border-white/20 overflow-hidden cursor-pointer group"
          onClick={() => m.data && handleViewDetails(m.data)}
        >
          {/* Subtle gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${m.bg} opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

          <div className="flex justify-between items-start mb-6 lg:mb-8 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground/80 tracking-wide">{m.title}</span>
              {m.data ? (
                <span className="text-xs font-medium text-muted-foreground">{m.data.period}</span>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">No Data</span>
              )}
            </div>
            <div className="relative p-2.5 rounded-2xl bg-foreground/5 dark:bg-white/[0.05] border border-border/50 dark:border-white/10 group-hover:bg-foreground/10 dark:group-hover:bg-white/[0.1] transition-colors duration-300">
              <div className="absolute inset-0 blur-[12px] rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: m.glow }}></div>
              <m.icon className={`h-5 w-5 ${m.color} relative z-10`} />
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between relative z-10 gap-4">
            <span className="font-mono text-3xl lg:text-4xl font-bold tracking-tight text-foreground drop-shadow-sm truncate">
              {m.data ? formatCurrencyAmount(m.data.totalSpent, currency) : "$0.00"}
            </span>
            
            {m.trend && (
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${m.trend.isUp ? 'bg-red-500/10 text-red-500 border border-red-500/20' : m.trend.isDown ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-foreground/5 text-muted-foreground border border-border/50 dark:bg-white/5 dark:text-white/50 dark:border-white/10'}`}>
                {m.trend.isUp ? <ArrowUpRight className="h-3 w-3" /> : m.trend.isDown ? <ArrowDownRight className="h-3 w-3" /> : null}
                <span>{m.trend.value}%</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* Detail Dialog */}
      {selectedPeriod && (
        <ExpenseDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={() => setIsDetailDialogOpen(false)}
          periodData={selectedPeriod}
        />
      )}
    </div>
  )
}
