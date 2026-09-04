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
