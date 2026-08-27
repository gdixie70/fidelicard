import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBrandsData, BrandEntry } from './brandSearch';

const REMOTE_URL =
  'https://raw.githubusercontent.com/gdixie70/fidelicard/main/assets/brands.json';
const CACHE_KEY = 'fidelicard.brands.remoteCache.v1';

/**
 * All'avvio: se esiste una copia in cache di un aggiornamento precedente,
 * la usa subito (più recente del bundle dell'app). In parallelo prova a
 * scaricare l'elenco più aggiornato da GitHub e lo mette in cache per la
 * prossima apertura. Se siamo offline o il file non è raggiungibile,
 * l'app continua a funzionare con quello che ha (cache, o il bundle
 * incluso nell'app) - nessun errore visibile all'utente.
 */
export async function initRemoteBrands(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) setBrandsData(JSON.parse(cached));
  } catch {
    // cache corrotta o non leggibile: si continua con il bundle dell'app
  }

  try {
    const response = await fetch(REMOTE_URL);
    if (!response.ok) return;

    const data: BrandEntry[] = await response.json();
    setBrandsData(data);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // offline o GitHub irraggiungibile: si resta su cache/bundle esistenti
  }
}
