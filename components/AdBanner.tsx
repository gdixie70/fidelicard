import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

type Props = {
  // 'dark' per le schermate con sfondo scuro (la maggior parte dell'app),
  // 'light' per quelle con sfondo chiaro (es. il dettaglio della tessera).
  variant?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
};

export default function AdBanner({ variant = 'dark', style }: Props) {
  const isLight = variant === 'light';
  return (
    <View style={[styles.banner, isLight ? styles.bannerLight : styles.bannerDark, style]}>
      <Text style={isLight ? styles.textLight : styles.textDark}>Spazio pubblicitario</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
