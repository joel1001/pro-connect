import { Platform } from 'react-native';

export type PaymentChannel = 'APP_STORE' | 'GOOGLE_PLAY' | 'DIRECT';

/** Maps the running app to the store fee channel used in payment breakdown. */
export function resolvePaymentChannel(): PaymentChannel {
  if (Platform.OS === 'ios') return 'APP_STORE';
  if (Platform.OS === 'android') return 'GOOGLE_PLAY';
  return 'DIRECT';
}
