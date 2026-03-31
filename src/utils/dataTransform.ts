/* * 
* Data conversion tools 
* Unified processing of front-end and back-end data format conversion (snake_case <-> camelCase) */

// Classification and payment method type definitions
export interface Category {
  id: number
  name: string
}

export interface PaymentMethod {
  id: number
  name: string
}

// Payment record related type definitions
export interface PaymentRecordApi {
  id: number
  subscription_id: number
  subscription_name: string
  subscription_plan: string
  payment_date: string
  amount_paid: number
  currency: string
  billing_period_start: string
  billing_period_end: string
  status: string
  notes?: string
  created_at?: string
}

export interface PaymentRecord {
  id: number
  subscriptionId: number
  subscriptionName: string
  subscriptionPlan: string
  paymentDate: string
  amountPaid: number
  currency: string
  billingPeriod: {
    start: string
    end: string
  }
  billingCycle?: string
  status: string
  notes?: string
}

/* * 
* Convert the payment record data returned by the API into front-end format 
* @param payment record in payment API format 
* @returns Payment record in front-end format */
export const transformPaymentFromApi = (payment: PaymentRecordApi): PaymentRecord => ({
  id: payment.id,
  subscriptionId: payment.subscription_id,
  subscriptionName: payment.subscription_name,
  subscriptionPlan: payment.subscription_plan,
  paymentDate: payment.payment_date,
  amountPaid: payment.amount_paid,
  currency: payment.currency,
  billingPeriod: {
    start: payment.billing_period_start,
    end: payment.billing_period_end
  },
  status: payment.status,
  notes: payment.notes
})

/* * 
* 将前端支付记录数据转换为API格式
 * @param payment payment record in front-end format 
* @returns payment record in API format */
export const transformPaymentToApi = (payment: PaymentRecord): Partial<PaymentRecordApi> => ({
  subscription_id: payment.subscriptionId,
  payment_date: payment.paymentDate,
  amount_paid: payment.amountPaid,
  currency: payment.currency,
  billing_period_start: payment.billingPeriod.start,
  billing_period_end: payment.billingPeriod.end,
  status: payment.status,
  notes: payment.notes
})

/* * 
* Array of payment records returned by batch conversion API 
* @param payments API format payment record array 
* @returns Array of payment records in front-end format */
export const transformPaymentsFromApi = (payments: PaymentRecordApi[]): PaymentRecord[] => {
  return payments.map(transformPaymentFromApi)
}

/* * 
* Universal snake_case to camelCase conversion function 
* @param obj Object containing snake_case key 
* @returns Object containing camelCase key */
export const snakeToCamel = (obj: unknown): unknown => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel)
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = snakeToCamel(value)
  }
  return result
}

/* * 
* Universal camelCase to snake_case conversion function 
* @param obj Object containing camelCase key 
* @returns object containing snake_case key */
export const camelToSnake = (obj: unknown): unknown => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake)
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = camelToSnake(value)
  }
  return result
}
