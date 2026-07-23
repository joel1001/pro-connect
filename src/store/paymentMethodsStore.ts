import { create } from 'zustand';

import { storage, STORAGE_KEYS } from '@/utils/storage';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

export interface SavedPaymentMethod {
  id: string;
  brand: CardBrand;
  holderName: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
}

interface AddPaymentMethodInput {
  holderName: string;
  cardNumber: string;
  expiry: string;
}

interface PaymentMethodsState {
  methods: SavedPaymentMethod[];
  ready: boolean;
  bootstrap: () => Promise<void>;
  addMethod: (input: AddPaymentMethodInput) => Promise<SavedPaymentMethod>;
  setDefault: (id: string) => Promise<void>;
  removeMethod: (id: string) => Promise<void>;
}

function normalizeCardNumber(value: string) {
  return value.replace(/\D/g, '');
}

function detectBrand(number: string): CardBrand {
  if (/^4/.test(number)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^(6011|65|64[4-9])/.test(number)) return 'discover';
  return 'unknown';
}

function isValidLuhn(number: string) {
  let sum = 0;
  let shouldDouble = false;

  for (let index = number.length - 1; index >= 0; index -= 1) {
    let digit = Number(number[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum > 0 && sum % 10 === 0;
}

function parseExpiry(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return null;

  const expiryMonth = digits.slice(0, 2);
  const expiryYear = digits.slice(2, 4);
  const month = Number(expiryMonth);
  const fullYear = 2000 + Number(expiryYear);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (month < 1 || month > 12) return null;
  if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) return null;

  return { expiryMonth, expiryYear };
}

async function persistMethods(methods: SavedPaymentMethod[]) {
  await storage.setJSON(STORAGE_KEYS.paymentMethods, methods);
}

export const usePaymentMethodsStore = create<PaymentMethodsState>((set, get) => ({
  methods: [],
  ready: false,

  bootstrap: async () => {
    const saved = await storage.getJSON<SavedPaymentMethod[]>(STORAGE_KEYS.paymentMethods);
    const methods = Array.isArray(saved) ? saved : [];
    set({ methods, ready: true });
  },

  addMethod: async (input) => {
    const holderName = input.holderName.trim();
    const cardNumber = normalizeCardNumber(input.cardNumber);
    const expiry = parseExpiry(input.expiry);

    if (!holderName || cardNumber.length < 12 || cardNumber.length > 19 || !isValidLuhn(cardNumber)) {
      throw new Error('invalid-card');
    }
    if (!expiry) {
      throw new Error('invalid-expiry');
    }

    const currentMethods = get().methods;
    const method: SavedPaymentMethod = {
      id: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      brand: detectBrand(cardNumber),
      holderName,
      last4: cardNumber.slice(-4),
      expiryMonth: expiry.expiryMonth,
      expiryYear: expiry.expiryYear,
      isDefault: currentMethods.length === 0,
      createdAt: new Date().toISOString(),
    };
    const methods = method.isDefault ? [method] : [...currentMethods, method];

    await persistMethods(methods);
    set({ methods });
    return method;
  },

  setDefault: async (id) => {
    const methods = get().methods.map((method) => ({ ...method, isDefault: method.id === id }));
    await persistMethods(methods);
    set({ methods });
  },

  removeMethod: async (id) => {
    const remainingMethods = get().methods.filter((method) => method.id !== id);
    const hasDefault = remainingMethods.some((method) => method.isDefault);
    const methods =
      hasDefault || remainingMethods.length === 0
        ? remainingMethods
        : remainingMethods.map((method, index) => ({ ...method, isDefault: index === 0 }));

    await persistMethods(methods);
    set({ methods });
  },
}));
