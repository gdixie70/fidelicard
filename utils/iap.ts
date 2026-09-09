import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// expo-iap è un modulo nativo: come per gli annunci (vedi utils/ads.ts), non
// esiste dentro Expo Go. Il bottone "Rimuovi pubblicità" viene mostrato solo
// quando questo è true (vedi components/RemoveAdsButton.tsx).
export const isNativeIapAvailable = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// Stesso ID prodotto da creare in App Store Connect (e poi Google Play
// Console) come acquisto "non consumabile" - una tantum, non abbonamento.
export const REMOVE_ADS_SKU = 'remove_ads';

const KEY = 'fidelicard.adsRemoved';

// Cache in memoria + notifica ai componenti in ascolto (es. più AdBanner
// montati contemporaneamente): evita di dover ricostruire un intero
// context/provider solo per un singolo flag booleano.
let cache: boolean | null = null;
const listeners = new Set<(value: boolean) => void>();

export async function getAdsRemoved(): Promise<boolean> {
  if (cache !== null) return cache;
  const stored = await AsyncStorage.getItem(KEY);
  cache = stored === '1';
  return cache;
}

export async function setAdsRemoved(value: boolean): Promise<void> {
  cache = value;
  await AsyncStorage.setItem(KEY, value ? '1' : '0');
  listeners.forEach((listener) => listener(value));
}

export function subscribeAdsRemoved(listener: (value: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
