import { logger } from '@/utils/logger';
import { apiClient } from '@/utils/api-client';

// API response type definition
export interface MonthlyCategorySummaryApiResponse {
  year: number;
  month: number;
  monthKey: string;
  categoryId: number;
  categoryValue: string;
  categoryLabel: string;
  totalAmount: number;
  baseCurrency: string;
  transactionsCount: number;
  updatedAt: string;
}

export interface MonthCategorySummaryResponse {
  year: number;
  month: number;
  categories: CategorySummary[];
  totalAmount: number;
  totalTransactions: number;
  baseCurrency: string;
}

export interface CategorySummary {
  categoryId: number;
  categoryValue: string;
  categoryLabel: string;
  totalAmount: number;
  baseCurrency: string;
  transactionsCount: number;
  updatedAt: string;
}

export interface TotalSummaryResponse {
  dateRange: {
    startYear: number;
    startMonth: number;
    endYear: number;
    endMonth: number;
  };
  totalAmount: number;
  totalTransactions: number;
  baseCurrency: string;
}

export interface MonthlyCategorySummariesResponse {
  summaries: MonthlyCategorySummaryApiResponse[];
  summary: {
    totalRecords: number;
    dateRange: {
      startYear: number;
      startMonth: number;
      endYear: number;
      endMonth: number;
    };
  };
}

/* * 
* Get monthly classified summary data */
export async function getMonthlyCategorySummaries(
  startYear?: number,
  startMonth?: number,
  endYear?: number,
  endMonth?: number
): Promise<MonthlyCategorySummariesResponse> {
  try {
    const params = new URLSearchParams();
    if (startYear) params.append('start_year', startYear.toString());
    if (startMonth) params.append('start_month', startMonth.toString());
    if (endYear) params.append('end_year', endYear.toString());
    if (endMonth) params.append('end_month', endMonth.toString());

    const url = `/monthly-category-summary?${params.toString()}`;
    logger.debug('Fetching monthly category summaries from:', url);

    return await apiClient.get<MonthlyCategorySummariesResponse>(url);
  } catch (error) {
    logger.error('Error fetching monthly category summaries:', error);
    throw error;
  }
}

/* * 
* Get the classified summary for the specified month */
export async function getMonthCategorySummary(
  year: number,
  month: number
): Promise<MonthCategorySummaryResponse> {
  try {
    const url = `/monthly-category-summary/${year}/${month}`;
    logger.debug('Fetching month category summary from:', url);

    return await apiClient.get<MonthCategorySummaryResponse>(url);
  } catch (error) {
    logger.error('Error fetching month category summary:', error);
    throw error;
  }
}

/* * 
* Get total summary data */
export async function getTotalSummary(
  startYear?: number,
  startMonth?: number,
  endYear?: number,
  endMonth?: number
): Promise<TotalSummaryResponse> {
  try {
    const params = new URLSearchParams();
    if (startYear) params.append('start_year', startYear.toString());
    if (startMonth) params.append('start_month', startMonth.toString());
    if (endYear) params.append('end_year', endYear.toString());
    if (endMonth) params.append('end_month', endMonth.toString());

    const url = `/monthly-category-summary/total?${params.toString()}`;
    logger.debug('Fetching total summary from:', url);

    return await apiClient.get<TotalSummaryResponse>(url);
  } catch (error) {
    logger.error('Error fetching total summary:', error);
    throw error;
  }
}

/* * 
* Recalculate all monthly subtotal data */
export async function recalculateAllSummaries(): Promise<{ message: string; timestamp: string }> {
  try {
    const url = `/protected/monthly-category-summary/recalculate`;
    logger.debug('Recalculating all summaries at:', url);

    return await apiClient.post<{ message: string; timestamp: string }>(url);
  } catch (error) {
    logger.error('Error recalculating summaries:', error);
    throw error;
  }
}

/* * 
* Process new payment records */
export async function processPayment(paymentId: number): Promise<{ message: string; paymentId: number; timestamp: string }> {
  try {
    const url = `/protected/monthly-category-summary/process-payment/${paymentId}`;
    logger.debug('Processing payment at:', url);

    return await apiClient.post<{ message: string; paymentId: number; timestamp: string }>(url);
  } catch (error) {
    logger.error('Error processing payment:', error);
    throw error;
  }
}

