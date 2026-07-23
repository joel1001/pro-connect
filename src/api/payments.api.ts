import { apiClient } from './client';
import { Payment } from '@/types';
import type { PaymentChannel } from '@/lib/paymentChannel';

export type PaymentPreview = {
  currency: string;
  countryCode: string;
  paymentChannel: string;
  baseServicePrice: number;
  platformCommissionRate: number;
  platformFee: number;
  marketplaceCommissionRate: number;
  marketplaceFee: number;
  taxRate: number;
  taxAmount: number;
  customCommissions: Payment['customCommissions'];
  customCommissionsTotal: number;
  storeFeeRate: number;
  storeFee: number;
  totalCharged: number;
  platformRetained: number;
  professionalEarnings: number;
};

export type PaymentConfig = {
  mode: 'simulated' | 'live';
  simulated: boolean;
  stripePublishableKey: string | null;
};

export type MonthlyTaxInvoice = {
  id: string;
  role: 'client' | 'professional';
  period: string;
  currency: string;
  reportablePayments: number;
  totalPaid: number;
  platformFees: number;
  customCommissions: number;
  professionalNet: number;
  clientExpense: number;
  generatedAt: string;
  invoices: MonthlyTaxInvoiceDetail[];
};

export type MonthlyTaxInvoiceDetail = {
  invoiceNumber: string;
  paymentId: string;
  contractId: string;
  transactionId?: string | null;
  status: Payment['status'];
  paidAt?: string | null;
  grossAmount: number;
  platformFee: number;
  customCommissions: number;
  professionalNet: number;
  clientExpense: number;
  currency: string;
  countryCode?: string | null;
};

export const paymentsApi = {
  config: () => apiClient.get<PaymentConfig>('/payments/config').then((r) => r.data),
  list: () => apiClient.get<Payment[]>('/payments').then((r) => r.data),
  get: (id: string) => apiClient.get<Payment>(`/payments/${id}`).then((r) => r.data),
  listDisputes: () => apiClient.get<Payment[]>('/payments/disputes').then((r) => r.data),
  monthlyTaxInvoice: (role: 'client' | 'professional') =>
    apiClient
      .get<MonthlyTaxInvoice>('/payments/tax-invoices/monthly', { params: { role } })
      .then((r) => r.data),
  downloadMonthlyTaxInvoice: (role: 'client' | 'professional') =>
    apiClient
      .get<string>('/payments/tax-invoices/monthly/download', {
        params: { role },
        responseType: 'text',
        transformResponse: [(data) => data],
      })
      .then((r) => r.data),
  preview: (params: { contractId: string; countryCode?: string; paymentChannel?: PaymentChannel }) =>
    apiClient.get<PaymentPreview>('/payments/preview', { params }).then((r) => r.data),
  previewQuote: (params: {
    amount: number;
    currency?: string;
    countryCode?: string;
    paymentChannel?: PaymentChannel;
  }) =>
    apiClient.get<PaymentPreview>('/payments/preview/quote', { params }).then((r) => r.data),
  create: (payload: {
    contractId: string;
    clientId: string;
    professionalId: string;
    amount: number;
    currency?: string;
    subscriptionPlan?: string;
    countryCode?: string;
    paymentChannel?: PaymentChannel;
  }) => apiClient.post<Payment>('/payments', payload).then((r) => r.data),
  hold: (id: string, paymentMethodId?: string) =>
    apiClient
      .post<Payment>(`/payments/${id}/hold`, paymentMethodId ? { paymentMethodId } : undefined)
      .then((r) => r.data),
};
