import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * react-native-google-mobile-ads è un modulo nativo: non esiste dentro
 * l'app Expo Go (che include solo un set fisso di moduli nativi decisi da
 * Expo), quindi importarlo/usarlo lì manderebbe in crash l'intera app.
 * Diventa disponibile solo in una dev build o in una build di produzione
 * (EAS build, o `expo prebuild` locale).
 */
export const isNativeAdsAvailable = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let googleMobileAds: typeof import('react-native-google-mobile-ads') | null = null;

if (isNativeAdsAvailable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    googleMobileAds = require('react-native-google-mobile-ads');
  } catch {
    googleMobileAds = null;
  }
}

export default googleMobileAds;

/**
 * Da chiamare una volta sola all'avvio, prima di mostrare qualunque banner.
 * Segue l'ordine richiesto da Apple/Google:
 * 1) App Tracking Transparency (solo iOS) - il permesso di sistema per
 *    identificare il dispositivo tra le app, obbligatorio se AdMob può
 *    mostrare pubblicità personalizzata.
 * 2) UMP (User Messaging Platform) di Google - il modulo di consenso GDPR
 *    richiesto per gli utenti nello Spazio Economico Europeo (quindi anche
 *    in Italia). Senza questo passaggio l'app rischia il rifiuto in
 *    revisione Apple e viola le policy di AdMob.
 * 3) Inizializzazione dell'SDK annunci, solo dopo aver raccolto il consenso.
 */
export async function initializeAdsWithConsent(): Promise<void> {
  if (!isNativeAdsAvailable || !googleMobileAds) return;

  if (Platform.OS === 'ios') {
    try {
      const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
      await requestTrackingPermissionsAsync();
    } catch {
      // Se il permesso non viene concesso o la richiesta fallisce, si
      // procede comunque: AdMob mostrerà solo annunci non personalizzati.
    }
  }

  try {
    const { AdsConsent } = googleMobileAds;
    await AdsConsent.gatherConsent();
  } catch {
    // Come sopra: un errore nella raccolta del consenso non deve impedire
    // all'app di avviarsi, l'SDK annunci gestisce da solo il fallback.
  }

  await googleMobileAds.default().initialize();
}
