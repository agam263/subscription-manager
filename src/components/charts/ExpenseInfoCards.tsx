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
      {metrics.map((m, i) => {
        const isPrimary = i === 0; // First card is the main orange card
        return (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`relative flex flex-col p-5 lg:p-6 rounded-[24px] shadow-sm overflow-hidden cursor-pointer group ${
              isPrimary 
                ? 'bg-gradient-to-br from-[#FF6B35] to-[#E84C15] text-white shadow-[#FF6B35]/20 shadow-lg border-none' 
                : 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white border border-black/5 dark:border-white/5'
            }`}
            onClick={() => m.data && handleViewDetails(m.data)}
          >
            <div className="flex justify-between items-start mb-6 lg:mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                  isPrimary ? 'bg-white/20' : 'bg-[#FAFAFA] dark:bg-[#2A2A2C]'
                }`}>
                  <m.icon className={`h-5 w-5 ${isPrimary ? 'text-white' : 'text-muted-foreground dark:text-white/70'}`} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold tracking-wide ${isPrimary ? 'text-white' : 'text-foreground/90'}`}>{m.title}</span>
                  {m.data ? (
                    <span className={`text-xs font-medium ${isPrimary ? 'text-white/80' : 'text-muted-foreground'}`}>{m.data.period}</span>
                  ) : (
                    <span className={`text-xs font-medium ${isPrimary ? 'text-white/80' : 'text-muted-foreground'}`}>No Data</span>
                  )}
                </div>
              </div>
              <div className={`p-1 rounded-full ${isPrimary ? 'text-white/70 hover:bg-white/20' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10'} transition-colors`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </div>
            </div>

            <div className="mt-auto flex flex-col relative z-10 gap-2">
              <span className={`font-mono text-3xl lg:text-4xl font-bold tracking-tight ${isPrimary ? 'text-white' : 'text-foreground'}`}>
                {m.data ? formatCurrencyAmount(m.data.totalSpent, currency) : "$0.00"}
              </span>
              
              <div className="flex items-center justify-between mt-1">
                {m.trend ? (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    isPrimary 
                      ? 'text-white/90' 
                      : m.trend.isUp 
                        ? 'text-red-500' 
                        : m.trend.isDown 
                          ? 'text-emerald-500' 
                          : 'text-muted-foreground'
                  }`}>
                    {m.trend.isUp ? <ArrowUpRight className="h-3 w-3" /> : m.trend.isDown ? <ArrowDownRight className="h-3 w-3" /> : null}
                    <span>{m.trend.value}% ↑</span>
                  </div>
                ) : (
                  <div className="h-4"></div>
                )}
                <span className={`text-xs font-medium group-hover:underline ${isPrimary ? 'text-white' : 'text-muted-foreground'}`}>
                  See details →
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}

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
