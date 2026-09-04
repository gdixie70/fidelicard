import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import googleMobileAds, { isNativeAdsAvailable } from '../utils/ads';

type Props = {
  // 'dark' per le schermate con sfondo scuro (la maggior parte dell'app),
  // 'light' per quelle con sfondo chiaro (es. il dettaglio della tessera).
  variant?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
};

export default function AdBanner({ variant = 'dark', style }: Props) {
  const isLight = variant === 'light';

  if (isNativeAdsAvailable && googleMobileAds) {
    const { BannerAd, BannerAdSize, TestIds } = googleMobileAds;
    return (
      <View style={[styles.adWrapper, style]}>
        <BannerAd
          // ID di TEST pubblici di Google: mostrano sempre un annuncio
          // fittizio in sviluppo, senza generare guadagni né rischiare
          // penalizzazioni dell'account per click accidentali. Da
          // sostituire con gli ID reali del tuo account AdMob (vedi
          // app.json) prima di pubblicare l'app.
          unitId={TestIds.BANNER}
          size={BannerAdSize.BANNER}
        />
      </View>
    );
  }

  return (
    <View style={[styles.banner, isLight ? styles.bannerLight : styles.bannerDark, style]}>
      <Text style={isLight ? styles.textLight : styles.textDark}>Spazio pubblicitario</Text>
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
