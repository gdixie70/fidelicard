import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import logoMap from '../utils/logoMap';
import { getBrandInfo } from '../utils/brandSearch';
import { hasCachedLogo } from '../utils/brandLogo';
import { Carta } from '../utils/types';
import BrandLogo from './BrandLogo';

const DEFAULT_CARD_COLOR = '#1E1E1E';

type Props = {
  carta: Carta;
  onPress?: () => void;
  badge?: React.ReactNode;
};

/**
 * Aspetto grafico di una tessera (logo, colore, badge col nome) - condiviso
 * tra la griglia della Home e quella di "Presta una tessera" in Collabora,
 * così le due pagine restano visivamente identiche senza duplicare lo stile.
 */
export default function CardTile({ carta, onPress, badge }: Props) {
  // Va ricalcolato ad ogni render con l'hook (non una volta sola con
  // Dimensions.get) altrimenti su iPad ruotando da verticale a orizzontale
  // le carte restano congelate alla larghezza di partenza, lasciando un
  // grosso spazio vuoto invece di riempire la riga.
  const { width } = useWindowDimensions();
  const cardWidth = width / 2 - 20;
  const cardHeight = cardWidth / 1.586;

  // Il brand viene ricercato di nuovo ad ogni render (invece di fidarsi solo
  // dei dati salvati con la carta) così che le carte aggiunte tempo fa
  // beneficino automaticamente di correzioni/aggiunte fatte in seguito a
  // brands.json (colori, loghi, domini), senza dover ri-aggiungere la carta.
  const brandInfo = getBrandInfo(carta.nome);
  const brandColor = brandInfo?.color || carta.colore || DEFAULT_CARD_COLOR;
  const logoSource = brandInfo?.logoUri ?? (carta.logoFile ? logoMap[carta.logoFile] : null);
  const logoFile = brandInfo?.logoFile ?? carta.logoFile ?? null;
  // Per i loghi non bundlati ma già recuperati in passato (cache su disco) lo
  // sappiamo subito, senza aspettare il fetch: hasCachedLogo è sincrono.
  const hasRealLogo = !!logoSource || hasCachedLogo(logoFile);
  // Alcuni loghi hanno uno sfondo pieno cucito dentro l'immagine (es. un
  // emblema come IKEA, o testo bianco su sfondo colorato come PAYBACK): per
  // quelli la scheda usa lo stesso colore, altrimenti il logo sembra un
  // adesivo scollato sopra un rettangolo bianco più grande.
  const backgroundColor = hasRealLogo ? brandInfo?.boxColor || '#FFFFFF' : brandColor;

  return (
    <View style={styles.shadowContainer}>
      <TouchableOpacity
        style={[
          styles.card,
          { width: cardWidth, height: cardHeight, backgroundColor },
          hasRealLogo && styles.cardWithLogo,
        ]}
        activeOpacity={0.85}
        onPress={onPress}
      >
        {badge}
        <View style={[styles.logo, hasRealLogo && styles.logoWithPadding]}>
          <BrandLogo brand={carta.nome} color={brandColor} logoSource={logoSource} logoFile={logoFile} icon={hasRealLogo ? null : carta.icon} />
        </View>
        <View style={styles.nameBadge}>
          <Text style={styles.nameText}>{carta.nome}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: 15,
    marginBottom: 15,
    backgroundColor: 'transparent',
    shadowColor: '#FDD835',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  card: {
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 10,
  },
  cardWithLogo: {
    borderWidth: 1,
    borderColor: '#E4E4E4',
  },
  logo: {
    width: '100%',
    height: '70%',
    alignSelf: 'center',
  },
  logoWithPadding: {
    width: '82%',
    height: '58%',
  },
  nameBadge: {
    backgroundColor: 'rgba(10, 10, 10, 0.77)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 8,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9800',
    textAlign: 'center',
  },
});
