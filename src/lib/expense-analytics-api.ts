import {
  getMonthlyCategorySummaries,
  getMonthCategorySummary,
  getTotalSummary,
  type MonthlyCategorySummariesResponse
} from '@/services/monthlyCategorySummaryApi';
import { convertCurrency } from '@/utils/currency';

// Adaptation API data type definition
export interface MonthlyExpense {
  monthKey: string;
  month: string; // Formatted month display, such as "Jun 2025"
  year: number;
  amount: number;
  subscriptionCount: number;
  paymentHistoryIds?: number[];
}

export interface ExpenseMetrics {
  totalSpent: number;
  averageMonthly: number;
  averagePerSubscription: number;
  highestMonth: MonthlyExpense | null;
  lowestMonth: MonthlyExpense | null;
  growthRate: number;
}

export interface YearlyExpense {
  year: number;
  amount: number;
  subscriptionCount: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  subscriptionCount: number;
}

/* * 
* Convert monthly subtotal data into the format required for grouped column charts */
export function transformMonthlyCategorySummariesToGroupedData(
  summariesResponse: MonthlyCategorySummariesResponse,
  targetCurrency: string
): { month: string; monthKey: string; year: number; categories: { [categoryName: string]: number }; total: number }[] {
  // Derive base currency from data (server truth); fallback to first summary or 'CNY'
  const serverBaseCurrency = summariesResponse.summaries[0]?.baseCurrency || 'CNY';
  // Group data by month
  const monthlyMap = new Map<string, { categories: Map<string, number>; total: number }>();

  summariesResponse.summaries.forEach(summary => {
    const monthKey = summary.monthKey;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { categories: new Map(), total: 0 });
    }

    const monthData = monthlyMap.get(monthKey)!;
    const convertedAmount = convertCurrency(summary.totalAmount, serverBaseCurrency, targetCurrency);
    const categoryName = summary.categoryLabel.toLowerCase();
    
    monthData.categories.set(categoryName, (monthData.categories.get(categoryName) || 0) + convertedAmount);
    monthData.total += convertedAmount;
  });

  // Convert to the format required for the chart
  return Array.from(monthlyMap.entries())
    .map(([monthKey, data]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      // Format month display
      const date = new Date(year, month - 1);
      const monthDisplay = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });

      // Convert Map to Object
      const categories: { [categoryName: string]: number } = {};
      data.categories.forEach((amount, category) => {
        categories[category] = Math.round(amount * 100) / 100;
      });

      return {
        monthKey,
        month: monthDisplay,
        year,
        categories,
        total: Math.round(data.total * 100) / 100
      };
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

/* * 
* Convert monthly subtotal data to annual grouped data */
export function transformMonthlyCategorySummariesToYearlyGroupedData(
  summariesResponse: MonthlyCategorySummariesResponse,
  targetCurrency: string
): { year: number; categories: { [categoryName: string]: number }; total: number }[] {
  const serverBaseCurrency = summariesResponse.summaries[0]?.baseCurrency || 'CNY';
  // Group data by year
  const yearlyMap = new Map<number, { categories: Map<string, number>; total: number }>();

  summariesResponse.summaries.forEach(summary => {
    const year = summary.year;

    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, { categories: new Map(), total: 0 });
    }

    const yearData = yearlyMap.get(year)!;
    const convertedAmount = convertCurrency(summary.totalAmount, serverBaseCurrency, targetCurrency);
    const categoryName = summary.categoryLabel.toLowerCase();
    
    yearData.categories.set(categoryName, (yearData.categories.get(categoryName) || 0) + convertedAmount);
    yearData.total += convertedAmount;
  });

  // Convert to the format required for the chart
  return Array.from(yearlyMap.entries())
    .map(([year, data]) => {
      // Convert Map to Object
      const categories: { [categoryName: string]: number } = {};
      data.categories.forEach((amount, category) => {
        categories[category] = Math.round(amount * 100) / 100;
      });

      return {
        year,
        categories,
        total: Math.round(data.total * 100) / 100
      };
    })
    .sort((a, b) => a.year - b.year);
}

/* * 
* Obtain annual classification grouping data based on new API */
export async function getApiYearlyCategoryExpenses(
  startDate: Date,
  endDate: Date,
  currency: string
): Promise<{ year: number; categories: { [categoryName: string]: number }; total: number }[]> {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  const response = await getMonthlyCategorySummaries(startYear, startMonth, endYear, endMonth);
  return transformMonthlyCategorySummariesToYearlyGroupedData(response, currency);
}
export async function getApiMonthlyCategoryExpenses(
  startDate: Date,
  endDate: Date,
  currency: string
): Promise<{ month: string; monthKey: string; year: number; categories: { [categoryName: string]: number }; total: number }[]> {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  const response = await getMonthlyCategorySummaries(startYear, startMonth, endYear, endMonth);
  return transformMonthlyCategorySummariesToGroupedData(response, currency);
}
export function transformMonthlyCategorySummaries(
  summariesResponse: MonthlyCategorySummariesResponse,
  targetCurrency: string
): MonthlyExpense[] {
  // Summarize data grouped by month
  const monthlyMap = new Map<string, { amount: number; transactionCount: number }>();
  const serverBaseCurrency = summariesResponse.summaries[0]?.baseCurrency || 'CNY';

  summariesResponse.summaries.forEach(summary => {
    const monthKey = summary.monthKey;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { amount: 0, transactionCount: 0 });
    }

    const monthData = monthlyMap.get(monthKey)!;
    // Convert from base currency to target currency
    const convertedAmount = convertCurrency(summary.totalAmount, serverBaseCurrency, targetCurrency);
    monthData.amount += convertedAmount;
    monthData.transactionCount += summary.transactionsCount;
  });

  // Convert to MonthlyExpense format
  return Array.from(monthlyMap.entries())
    .map(([monthKey, data]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      // Format month display
      const date = new Date(year, month - 1);
      const monthDisplay = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });

      return {
        monthKey,
        month: monthDisplay,
        year,
        amount: Math.round(data.amount * 100) / 100,
        subscriptionCount: data.transactionCount,
        paymentHistoryIds: Array.from({ length: data.transactionCount }, (_, i) => i + 1) // Generate payment ID array for calculating payment quantity
      };
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

/* * 
* Get monthly cost data based on new API */
export async function getApiMonthlyExpenses(
  startDate: Date,
  endDate: Date,
  currency: string // Maintain compatibility, but the new system uses the base currency uniformly
): Promise<MonthlyExpense[]> {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  const response = await getMonthlyCategorySummaries(startYear, startMonth, endYear, endMonth);
  return transformMonthlyCategorySummaries(response, currency);
}





/* * 
* Calculate annual expense data (aggregated from monthly data) */
export function calculateYearlyExpensesFromMonthly(monthlyExpenses: MonthlyExpense[]): YearlyExpense[] {
  const yearlyMap = new Map<number, { amount: number; subscriptions: Set<number> }>();

  monthlyExpenses.forEach(expense => {
    if (!yearlyMap.has(expense.year)) {
      yearlyMap.set(expense.year, { amount: 0, subscriptions: new Set() });
    }

    const yearData = yearlyMap.get(expense.year)!;
    yearData.amount += expense.amount;
    
    // Add payment history ID to subscription collection
    if (expense.paymentHistoryIds) {
      expense.paymentHistoryIds.forEach(id => yearData.subscriptions.add(id));
    }
  });

  return Array.from(yearlyMap.entries())
    .map(([year, data]) => ({
      year,
      amount: data.amount,
      subscriptionCount: data.subscriptions.size
    }))
    .sort((a, b) => a.year - b.year);
}

/* * 
* Get current month’s expenses */
export async function getCurrentMonthSpending(currency: string): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  try {
    const response = await getMonthCategorySummary(currentYear, currentMonth);
    // Convert from API base currency to user's preferred currency
    const convertedAmount = convertCurrency(response.totalAmount, response.baseCurrency, currency);
    return convertedAmount;
  } catch (error) {
    console.error('Failed to get current month spending:', error);
    return 0;
  }
}

/* * 
* Get the total expenditure for the year (only calculated to the current month) */
export async function getCurrentYearSpending(currency: string): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1

  try {
    const response = await getTotalSummary(currentYear, 1, currentYear, currentMonth);
    // Convert from API base currency to user's preferred currency
    const convertedAmount = convertCurrency(response.totalAmount, response.baseCurrency, currency);
    return convertedAmount;
  } catch (error) {
    console.error('Failed to get current year spending:', error);
    return 0;
  }
}

/* * 
* Calculate category spend from new API data */
export function calculateCategoryExpensesFromNewApi(
  summariesResponse: MonthlyCategorySummariesResponse,
  targetCurrency: string
): CategoryExpense[] {
  const categoryMap = new Map<string, { amount: number; transactionCount: number }>();
  let totalAmount = 0;
  const serverBaseCurrency = summariesResponse.summaries[0]?.baseCurrency || 'CNY';

  // Aggregate categorical data for all months
  summariesResponse.summaries.forEach(summary => {
    const categoryLabel = summary.categoryLabel;
    // Convert from API base currency to target currency
    const convertedAmount = convertCurrency(summary.totalAmount, serverBaseCurrency, targetCurrency);

    if (!categoryMap.has(categoryLabel)) {
      categoryMap.set(categoryLabel, { amount: 0, transactionCount: 0 });
    }

    const categoryData = categoryMap.get(categoryLabel)!;
    categoryData.amount += convertedAmount;
    categoryData.transactionCount += summary.transactionsCount;
    totalAmount += convertedAmount;
  });

  // Convert to CategoryExpense array and calculate percentage
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: Math.round(data.amount * 100) / 100,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      subscriptionCount: data.transactionCount
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by amount in descending order
}

/* * 
* Obtain classified expenditure data based on new API */
export async function getApiCategoryExpenses(
  startDate: Date,
  endDate: Date,
  currency: string
): Promise<CategoryExpense[]> {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  const response = await getMonthlyCategorySummaries(startYear, startMonth, endYear, endMonth);
  return calculateCategoryExpensesFromNewApi(response, currency);
}
