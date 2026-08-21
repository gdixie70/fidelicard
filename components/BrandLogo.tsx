import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import tinycolor from 'tinycolor2';
import { getRemoteLogoUri } from '../utils/brandLogo';

type Props = {
  brand: string;
  color: string;
  domain?: string | null;
  logoSource?: any | null; // già risolto (es. da logoMap o dalla ricerca brand)
  // Contenitore quadrato che ospita sia il badge (View) sia il logo (Image):
  // qui passiamo solo dimensioni/margini, mai proprietà non condivise come `overflow`.
  style?: StyleProp<ViewStyle>;
};

const initialsFor = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Mostra il logo di un brand con tre livelli di fallback:
 * 1) immagine locale già inclusa nell'app (istantanea, sempre corretta)
 * 2) immagine reale recuperata da un servizio pubblico e messa in cache sul device
 * 3) badge colorato generato con le iniziali del brand, se nessuna immagine è disponibile
 */
export default function BrandLogo({ brand, color, domain, logoSource, style }: Props) {
  const localSource = logoSource ?? null;
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  useEffect(() => {
    setRemoteUri(null);
    if (localSource || !domain) return;

    let cancelled = false;
    getRemoteLogoUri(domain).then((uri) => {
      if (!cancelled) setRemoteUri(uri);
    });
    return () => {
      cancelled = true;
    };
  }, [localSource, domain]);

  if (localSource) {
    return <Image source={localSource} style={[styles.image, style] as StyleProp<ImageStyle>} resizeMode="contain" />;
  }

  if (remoteUri) {
    return <Image source={{ uri: remoteUri }} style={[styles.image, style] as StyleProp<ImageStyle>} resizeMode="contain" />;
  }

  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      <Text
        style={[
          styles.badgeText,
          { color: tinycolor(color).isLight() ? '#1E1E1E' : '#fff' },
        ]}
        numberOfLines={1}
      >
        {initialsFor(brand)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 20,
    fontWeight: '800',
  },
});
