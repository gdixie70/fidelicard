import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import googleMobileAds, { isNativeAdsAvailable } from '../utils/ads';
import { getAdsRemoved, subscribeAdsRemoved } from '../utils/iap';
import { t } from '../utils/i18n';

type Props = {
  // 'dark' per le schermate con sfondo scuro (la maggior parte dell'app),
  // 'light' per quelle con sfondo chiaro (es. il dettaglio della tessera).
  variant?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
};

// Attiva EXPO_PUBLIC_HIDE_ADS=1 solo in una build dedicata (profilo "screenshots"
// in eas.json) per prendere screenshot puliti per il sito o gli store: la build
// "production" normale non lo imposta mai, quindi non c'è rischio di pubblicare
// per sbaglio una versione senza pubblicità.
const adsHidden = process.env.EXPO_PUBLIC_HIDE_ADS === '1';

// ID reale del blocco annunci Banner su AdMob (account Google AdMob di
// Gianluca, app "Fidelicard" iOS). Da qui in poi mostra annunci veri: non
// toccare/cliccare ripetutamente i propri annunci durante i test, Google
// considera i click "auto-generati" traffico non valido e può sospendere
// l'account AdMob.
const BANNER_UNIT_ID = 'ca-app-pub-1231745392454227/8807802539';

export default function AdBanner({ variant = 'dark', style }: Props) {
  const isLight = variant === 'light';
  const [adsRemoved, setAdsRemovedState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdsRemoved().then((value) => {
      if (!cancelled) setAdsRemovedState(value);
    });
    const unsubscribe = subscribeAdsRemoved(setAdsRemovedState);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (adsHidden || adsRemoved) return null;

  if (isNativeAdsAvailable && googleMobileAds) {
    const { BannerAd, BannerAdSize } = googleMobileAds;
    return (
      <View style={[styles.adWrapper, style]}>
        <BannerAd unitId={BANNER_UNIT_ID} size={BannerAdSize.BANNER} />
      </View>
    );
  }

  return (
    <View style={[styles.banner, isLight ? styles.bannerLight : styles.bannerDark, style]}>
      <Text style={isLight ? styles.textLight : styles.textDark}>{t('adBanner.placeholder')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  adWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    height: 50,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerDark: {
    backgroundColor: '#1C1C1C',
    borderColor: '#333',
  },
  bannerLight: {
    backgroundColor: '#F2F2F2',
    borderColor: '#DDD',
  },
  textDark: {
    fontSize: 12,
    color: '#666',
  },
  textLight: {
    fontSize: 12,
    color: '#999',
  },
});
