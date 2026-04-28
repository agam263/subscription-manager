import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscriptionStore } from "@/store/subscriptionStore"
import { useSettingsStore } from "@/store/settingsStore"
import {
  getApiMonthlyExpenses,
  getApiCategoryExpenses,
  getApiMonthlyCategoryExpenses,
  getApiYearlyCategoryExpenses,
  calculateYearlyExpensesFromMonthly,
  MonthlyExpense,
  YearlyExpense,
  CategoryExpense
} from "@/lib/expense-analytics-api"
import {
  convertMonthlyExpensesToInfo,
  calculateQuarterlyExpenses,
  calculateYearlyExpenses,
  filterRecentExpenses
} from "@/lib/expense-info-analytics"
import { ExpenseInfoData } from "@/components/charts/ExpenseInfoCards"
import { ExpenseTrendChart } from "@/components/charts/ExpenseTrendChart"
import { YearlyTrendChart } from "@/components/charts/YearlyTrendChart"
import { CategoryPieChart } from "@/components/charts/CategoryPieChart"
import { ExpenseInfoCards } from "@/components/charts/ExpenseInfoCards"
import { apiClient } from '@/utils/api-client'
import type { PaymentRecordApi } from '@/utils/dataTransform'
import LaserFlow from '@/components/LaserFlow'

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"


export function ExpenseReportsPage() {
  const { fetchSubscriptions, fetchCategories } = useSubscriptionStore()
  const { t } = useTranslation(['reports', 'common'])
  const { currency: userCurrency, fetchSettings } = useSettingsStore()

  // Filter states
  const [selectedDateRange] = useState('Last 12 Months')
  const [selectedYearlyDateRange] = useState(() => {
    const currentYear = new Date().getFullYear()
    return `${currentYear - 2} - ${currentYear}`
  })
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly')

  // Fetch data when component mounts
  const initializeData = useCallback(async () => {
    await fetchSubscriptions()
    await fetchCategories()
    await fetchSettings()
  }, [fetchSubscriptions, fetchCategories, fetchSettings])

  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Get date range presets - create stable date range
  const currentDateRange = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const presets = {
      'Last 3 Months': {
        startDate: new Date(currentYear, currentMonth - 2, 1),
        endDate: now
      },
      'Last 6 Months': {
        startDate: new Date(currentYear, currentMonth - 5, 1),
        endDate: now
      },
      'Last 12 Months': {
        startDate: new Date(currentYear, currentMonth - 11, 1),
        endDate: now
      },
      'This Year': {
        startDate: new Date(currentYear, 0, 1),
        endDate: now
      },
      'Last Year': {
        startDate: new Date(currentYear - 1, 0, 1),
        endDate: new Date(currentYear - 1, 11, 31)
      }
    }

    return presets[selectedDateRange as keyof typeof presets] || presets['Last 12 Months']
  }, [selectedDateRange])

  // Get yearly date range presets (fixed recent 3 years)
  const yearlyDateRangePresets = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-11
    return [
      {
        label: `${currentYear - 2} - ${currentYear}`,
        startDate: new Date(currentYear - 2, 0, 1), // January 1st of 3 years ago
        endDate: new Date(currentYear, currentMonth, new Date(currentYear, currentMonth + 1, 0).getDate()) // Last day of current month
      }
    ]
  }, [])

  const currentYearlyDateRange = useMemo(() => {
    return yearlyDateRangePresets.find(preset => preset.label === selectedYearlyDateRange)
      || yearlyDateRangePresets[0] // Default to Recent 3 Years
  }, [selectedYearlyDateRange, yearlyDateRangePresets])

  // State for API data
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([])
  const [yearlyExpenses, setYearlyExpenses] = useState<YearlyExpense[]>([])
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([])
  const [yearlyCategoryExpenses, setYearlyCategoryExpenses] = useState<CategoryExpense[]>([])
  const [monthlyCategoryExpenses, setMonthlyCategoryExpenses] = useState<{ month: string; monthKey: string; year: number; categories: { [categoryName: string]: number }; total: number }[]>([])
  const [yearlyGroupedCategoryExpenses, setYearlyGroupedCategoryExpenses] = useState<{ year: number; categories: { [categoryName: string]: number }; total: number }[]>([])

  // State for expense info data
  const [expenseInfoData, setExpenseInfoData] = useState<{
    monthly: ExpenseInfoData[]
    quarterly: ExpenseInfoData[]
    yearly: ExpenseInfoData[]
  }>({
    monthly: [],
    quarterly: [],
    yearly: []
  })

  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)
  const [isLoadingYearlyExpenses, setIsLoadingYearlyExpenses] = useState(false)
  const [isLoadingCategoryExpenses, setIsLoadingCategoryExpenses] = useState(false)
  const [isLoadingYearlyCategoryExpenses, setIsLoadingYearlyCategoryExpenses] = useState(false)
  const [, setIsLoadingMonthlyCategoryExpenses] = useState(false)
  const [, setIsLoadingYearlyGroupedCategoryExpenses] = useState(false)

  const [isLoadingExpenseInfo, setIsLoadingExpenseInfo] = useState(false)
  const [expenseError, setExpenseError] = useState<string | null>(null)
  const [yearlyExpenseError, setYearlyExpenseError] = useState<string | null>(null)
  const [categoryExpenseError, setCategoryExpenseError] = useState<string | null>(null)
  const [yearlyCategoryExpenseError, setYearlyCategoryExpenseError] = useState<string | null>(null)
  const [, setMonthlyCategoryExpenseError] = useState<string | null>(null)
  const [, setYearlyGroupedCategoryExpenseError] = useState<string | null>(null)

  const [expenseInfoError, setExpenseInfoError] = useState<string | null>(null)



  // Load expense info data (recent periods)
  useEffect(() => {
    const loadExpenseInfoData = async () => {
      setIsLoadingExpenseInfo(true)
      setExpenseInfoError(null)

      try {
        // Get recent 12 months of data for expense info
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 12)

        const allMonthlyData = await getApiMonthlyExpenses(startDate, endDate, userCurrency)

        // Process API data
        if (allMonthlyData && allMonthlyData.length > 0) {
          const { monthlyExpenses: recentMonthly, quarterlyExpenses: recentQuarterly, yearlyExpenses: recentYearly } = filterRecentExpenses(allMonthlyData)

          // Convert to expense info format
          const monthlyInfo = convertMonthlyExpensesToInfo(recentMonthly, userCurrency)
          const quarterlyInfo = calculateQuarterlyExpenses(recentQuarterly, userCurrency)
          const yearlyInfo = calculateYearlyExpenses(recentYearly, userCurrency)

          // Ensure paymentCount matches real payment-history records
          const fillAccurateCounts = async (list: ExpenseInfoData[]): Promise<ExpenseInfoData[]> => {
            const updated = await Promise.all(
              list.map(async (item) => {
                try {
                  const records = await apiClient.get<PaymentRecordApi[]>(
                    `/payment-history?start_date=${item.startDate}&end_date=${item.endDate}&status=succeeded`
                  )
                  return { ...item, paymentCount: records.length }
                } catch {
                  return item
                }
              })
            )
            return updated
          }

          const [monthlyFixed, quarterlyFixed, yearlyFixed] = await Promise.all([
            fillAccurateCounts(monthlyInfo),
            fillAccurateCounts(quarterlyInfo),
            fillAccurateCounts(yearlyInfo)
          ])

          setExpenseInfoData({
            monthly: monthlyFixed,
            quarterly: quarterlyFixed,
            yearly: yearlyFixed
          })
        } else {
          // No data available, set empty state
          setExpenseInfoData({
            monthly: [],
            quarterly: [],
            yearly: []
          })
        }

      } catch (error) {
        console.error('Failed to load expense info data:', error)
        setExpenseInfoError(error instanceof Error ? error.message : 'Failed to load expense info data')

        // Set empty state on error
        setExpenseInfoData({
          monthly: [],
          quarterly: [],
          yearly: []
        })
      } finally {
        setIsLoadingExpenseInfo(false)
      }
    }

    loadExpenseInfoData()
  }, [userCurrency])

  // Load monthly expense data from API
  useEffect(() => {
    const loadMonthlyExpenseData = async () => {
      setIsLoadingExpenses(true)
      setExpenseError(null)

      try {
        // Fetch monthly expenses from API
        const monthlyData = await getApiMonthlyExpenses(currentDateRange.startDate, currentDateRange.endDate, userCurrency);
        setMonthlyExpenses(monthlyData)

      } catch (error) {
        console.error('Failed to load monthly expense data:', error)
        setExpenseError(error instanceof Error ? error.message : 'Failed to load monthly expense data')
      } finally {
        setIsLoadingExpenses(false)
      }
    }

    const loadMonthlyCategoryExpenseData = async () => {
      setIsLoadingMonthlyCategoryExpenses(true)
      setMonthlyCategoryExpenseError(null)

      try {
        // Fetch monthly category expenses from API
        const monthlyCategoryData = await getApiMonthlyCategoryExpenses(currentDateRange.startDate, currentDateRange.endDate, userCurrency);
        setMonthlyCategoryExpenses(monthlyCategoryData)

      } catch (error) {
        console.error('Failed to load monthly category expense data:', error)
        setMonthlyCategoryExpenseError(error instanceof Error ? error.message : 'Failed to load monthly category expense data')
      } finally {
        setIsLoadingMonthlyCategoryExpenses(false)
      }
    }

    loadMonthlyExpenseData()
    loadMonthlyCategoryExpenseData()
  }, [currentDateRange, userCurrency])

  // Load category expense data from API
  useEffect(() => {
    const loadCategoryExpenseData = async () => {
      setIsLoadingCategoryExpenses(true)
      setCategoryExpenseError(null)

      try {
        // Fetch category expenses from API
        const categoryData = await getApiCategoryExpenses(currentDateRange.startDate, currentDateRange.endDate, userCurrency);
        setCategoryExpenses(categoryData)

      } catch (error) {
        console.error('Failed to load category expense data:', error)
        setCategoryExpenseError(error instanceof Error ? error.message : 'Failed to load category expense data')
      } finally {
        setIsLoadingCategoryExpenses(false)
      }
    }

    loadCategoryExpenseData()
  }, [currentDateRange, userCurrency])

  // Load yearly expense data from API (using separate date range)
  useEffect(() => {
    const loadYearlyExpenseData = async () => {
      setIsLoadingYearlyExpenses(true)
      setYearlyExpenseError(null)

      try {
        // Fetch yearly expenses using the 3-year date range
        const yearlyMonthlyData = await getApiMonthlyExpenses(
          currentYearlyDateRange.startDate,
          currentYearlyDateRange.endDate,
          userCurrency
        );

        // Calculate yearly expenses from monthly data
        const yearlyData = calculateYearlyExpensesFromMonthly(yearlyMonthlyData)
        setYearlyExpenses(yearlyData)



      } catch (error) {
        console.error('Failed to load yearly expense data:', error)
        setYearlyExpenseError(error instanceof Error ? error.message : 'Failed to load yearly expense data')
      } finally {
        setIsLoadingYearlyExpenses(false)
      }
    }

    loadYearlyExpenseData()
  }, [currentYearlyDateRange, userCurrency])

  // Load yearly category expense data from API
  useEffect(() => {
    const loadYearlyCategoryExpenseData = async () => {
      setIsLoadingYearlyCategoryExpenses(true)
      setYearlyCategoryExpenseError(null)

      try {
        // Fetch yearly category expenses from API using yearly date range
        const yearlyCategoryData = await getApiCategoryExpenses(
          currentYearlyDateRange.startDate,
          currentYearlyDateRange.endDate,
          userCurrency
        );
        setYearlyCategoryExpenses(yearlyCategoryData)

      } catch (error) {
        console.error('Failed to load yearly category expense data:', error)
        setYearlyCategoryExpenseError(error instanceof Error ? error.message : 'Failed to load yearly category expense data')
      } finally {
        setIsLoadingYearlyCategoryExpenses(false)
      }
    }

    const loadYearlyGroupedCategoryExpenseData = async () => {
      setIsLoadingYearlyGroupedCategoryExpenses(true)
      setYearlyGroupedCategoryExpenseError(null)

      try {
        // Fetch yearly grouped category expenses from API
        const yearlyGroupedCategoryData = await getApiYearlyCategoryExpenses(
          currentYearlyDateRange.startDate,
          currentYearlyDateRange.endDate,
          userCurrency
        );
        setYearlyGroupedCategoryExpenses(yearlyGroupedCategoryData)

      } catch (error) {
        console.error('Failed to load yearly grouped category expense data:', error)
        setYearlyGroupedCategoryExpenseError(error instanceof Error ? error.message : 'Failed to load yearly grouped category expense data')
      } finally {
        setIsLoadingYearlyGroupedCategoryExpenses(false)
      }
    }

    loadYearlyCategoryExpenseData()
    loadYearlyGroupedCategoryExpenseData()
  }, [currentYearlyDateRange, userCurrency])

  return (
    <div className="relative min-h-full space-y-6 pb-10 bg-[#FAFAFA] dark:bg-[#111111]">
      {/* Modern solid backdrop matching reference */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#FAFAFA] dark:bg-[#111111]" />

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between z-10 relative px-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
      </div>

      {/* High-density grid header section (Info Cards) */}
      <div className="w-full relative z-10">
        {isLoadingExpenseInfo ? (
          <ExpenseInfoCards
            monthlyData={[]}
            quarterlyData={[]}
            yearlyData={[]}
            currency={userCurrency}
            isLoading={true}
          />
        ) : expenseInfoError ? (
          <div className="flex items-center justify-center p-6 bg-background/50 dark:bg-white/[0.03] backdrop-blur-[16px] rounded-[24px] border border-border/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <div className="text-center">
              <p className="text-sm text-red-500 font-bold mb-1">{t('failedToLoadExpenseOverview')}</p>
              <p className="text-xs text-muted-foreground">{expenseInfoError}</p>
            </div>
          </div>
        ) : (
          <ExpenseInfoCards
            monthlyData={expenseInfoData.monthly}
            quarterlyData={expenseInfoData.quarterly}
            yearlyData={expenseInfoData.yearly}
            currency={userCurrency}
          />
        )}
      </div>

      {/* Loading and Error States for charts */}
      {isLoadingExpenses && (
        <div className="flex items-center justify-center h-24 bg-background/50 dark:bg-white/[0.02] backdrop-blur-[16px] rounded-[24px] border border-border/50 dark:border-white/10 mt-4 relative z-10">
          <div className="text-center flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
            <p className="text-xs text-muted-foreground">{t('loadingExpenseData')}</p>
          </div>
        </div>
      )}

      {expenseError && (
        <div className="flex items-center justify-center h-24 bg-red-500/5 backdrop-blur-[16px] rounded-[24px] border border-red-500/10 mt-4 relative z-10">
          <div className="text-center">
            <p className="text-sm text-red-400 font-semibold mb-1">{t('failedToLoadExpenseData')}</p>
            <p className="text-xs text-red-400/70">{expenseError}</p>
          </div>
        </div>
      )}

      {/* The Data Grid Dashboard (12-column Grid) */}
      {(!isLoadingExpenses && !expenseError) && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-6 w-full relative z-10"
        >
          {/* Main Visual: Expense Trends Chart - Spans 8 cols */}
          <div className="col-span-1 lg:col-span-8 flex flex-col relative group rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-500 overflow-hidden">
            
            {/* Minimal Inline Top Controls */}
            <div className="absolute top-4 right-4 z-20 flex gap-1 bg-[#FAFAFA] dark:bg-[#2A2A2C] p-1 rounded-xl border border-black/5 dark:border-white/5">
              <button
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-300 flex-1 ${activeTab === 'monthly' ? 'bg-white dark:bg-[#3A3A3D] text-black dark:text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                onClick={() => setActiveTab('monthly')}
              >
                {t('monthly')}
              </button>
              <button
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-300 flex-1 ${activeTab === 'yearly' ? 'bg-white dark:bg-[#3A3A3D] text-black dark:text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                onClick={() => setActiveTab('yearly')}
              >
                {t('yearly')}
              </button>
            </div>
            
            {/* Chart Container */}
            <div className="flex-1 w-full min-h-[400px] lg:min-h-[440px] pt-12">
              {activeTab === 'monthly' ? (
                <ExpenseTrendChart
                  data={monthlyExpenses}
                  categoryData={monthlyCategoryExpenses}
                  currency={userCurrency}
                />
              ) : (
                <YearlyTrendChart
                  data={yearlyExpenses}
                  categoryData={yearlyGroupedCategoryExpenses}
                  currency={userCurrency}
                />
              )}
            </div>
          </div>

          {/* Side Visual: Spending By Category - Spans 4 cols */}
          <div className="col-span-1 lg:col-span-4 flex flex-col relative rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-500 overflow-hidden">
            <div className="flex-1 w-full min-h-[400px] lg:min-h-[440px]">
              {activeTab === 'monthly' ? (
                isLoadingCategoryExpenses ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary/50"></div>
                  </div>
                ) : categoryExpenseError ? (
                  <div className="flex items-center justify-center h-full px-4">
                     <div className="text-center text-red-500/80 text-xs font-medium">{categoryExpenseError}</div>
                  </div>
                ) : (
                  <CategoryPieChart
                    data={categoryExpenses}
                    currency={userCurrency}
                    descriptionKey="chart.breakdownByCategory"
                  />
                )
              ) : (
                isLoadingYearlyCategoryExpenses ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary/50"></div>
                  </div>
                ) : yearlyCategoryExpenseError ? (
                  <div className="flex items-center justify-center h-full px-4">
                     <div className="text-center text-red-500/80 text-xs font-medium">{yearlyCategoryExpenseError}</div>
                  </div>
                ) : (
                  <CategoryPieChart
                    data={yearlyCategoryExpenses}
                    currency={userCurrency}
                    descriptionKey="chart.breakdownByCategoryYearly"
                  />
                )
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
