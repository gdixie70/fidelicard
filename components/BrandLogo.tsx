import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import tinycolor from 'tinycolor2';
import { Ionicons } from '@expo/vector-icons';
import { getRemoteLogoUri } from '../utils/brandLogo';

type Props = {
  brand: string;
  color: string;
  logoFile?: string | null; // nome file in assets/loghi, per il recupero remoto se non bundlato
  logoSource?: any | null; // già risolto (es. da logoMap o dalla ricerca brand)
  // Icona scelta a mano dall'utente quando non c'è un logo ufficiale - vedi
  // Carta.icon. Usata solo se non c'è nessun logo, reale o vero, disponibile.
  icon?: string | null;
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
 * Mostra il logo di un brand con quattro livelli di fallback:
 * 1) immagine locale già inclusa nell'app (istantanea, sempre corretta, offline dal primo avvio)
 * 2) immagine recuperata dal repository GitHub del progetto e messa in cache sul device
 *    (per i brand aggiunti dopo l'ultima pubblicazione dell'app, non ancora bundlati)
 * 3) icona scelta a mano dall'utente, se non c'è ancora un logo ufficiale
 * 4) badge colorato con le iniziali del brand, se non c'è né logo né icona
 */
export default function BrandLogo({ brand, color, logoFile, logoSource, icon, style }: Props) {
  const localSource = logoSource ?? null;
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  useEffect(() => {
    setRemoteUri(null);
    if (localSource || !logoFile) return;

    let cancelled = false;
    getRemoteLogoUri(logoFile).then((uri) => {
      if (!cancelled) setRemoteUri(uri);
    });
    return () => {
      cancelled = true;
    };
  }, [localSource, logoFile]);

  if (localSource) {
    return <Image source={localSource} style={[styles.image, style] as StyleProp<ImageStyle>} resizeMode="contain" />;
  }

  if (remoteUri) {
    return <Image source={{ uri: remoteUri }} style={[styles.image, style] as StyleProp<ImageStyle>} resizeMode="contain" />;
  }

  const contentColor = tinycolor(color).isLight() ? '#1E1E1E' : '#fff';

  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      {icon ? (
        <Ionicons name={icon as any} size={28} color={contentColor} />
      ) : (
        <Text style={[styles.badgeText, { color: contentColor }]} numberOfLines={1}>
          {initialsFor(brand)}
        </Text>
      )}
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
