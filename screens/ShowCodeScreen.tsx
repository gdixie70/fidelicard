import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import Barcode from 'react-native-barcode-svg';
import { RootStackParamList } from '../App';
import { detectBarcodeFormat, BarcodeFormat } from '../utils/barcodeFormat';
import { formatDateIt } from '../utils/duration';
import { getBrandInfo } from '../utils/brandSearch';
import { hasCachedLogo } from '../utils/brandLogo';
import logoMap from '../utils/logoMap';
import { Carta } from '../utils/types';
import BrandLogo from '../components/BrandLogo';
import AdBanner from '../components/AdBanner';
import { t } from '../utils/i18n';

const DEFAULT_CARD_COLOR = '#1E1E1E';

type Params = {
  params: {
    id: string;
  };
};

export default function ShowCodeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const barcodeWidth = windowWidth - 112;
  const headerWidth = windowWidth - 80;
  const headerHeight = headerWidth / 2.2;

  const route = useRoute<RouteProp<Params>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [card, setCard] = useState<Carta | null>(null);
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [copied, setCopied] = useState(false);
  const id = route.params.id;

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    const json = await AsyncStorage.getItem('carte');
    if (!json) return;

    const carte: Carta[] = JSON.parse(json);
    const foundIndex = carte.findIndex((c) => c.id === id);
    if (foundIndex === -1) return;

    const selected = carte[foundIndex];

    // aggiorna contatore uso
    const uso = selected.uso ? selected.uso + 1 : 1;
    carte[foundIndex] = { ...selected, uso };
    await AsyncStorage.setItem('carte', JSON.stringify(carte));

    setCard(carte[foundIndex]);
    setFormat(detectBarcodeFormat(carte[foundIndex].codice));
  };

  const removePrestito = (destinatario: string) => {
    Alert.alert(
      t('collabora.removeTitle'),
      t('collabora.removeBody', { name: destinatario }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('collabora.removeConfirm'),
          style: 'destructive',
          onPress: async () => {
            if (!card) return;
            const nuoviPrestiti = (card.prestiti || []).filter((p) => p.destinatario !== destinatario);
            const json = await AsyncStorage.getItem('carte');
            const carte: Carta[] = json ? JSON.parse(json) : [];
            const next = carte.map((c) => (c.id === card.id ? { ...c, prestiti: nuoviPrestiti } : c));
            await AsyncStorage.setItem('carte', JSON.stringify(next));
            setCard({ ...card, prestiti: nuoviPrestiti });
          },
        },
      ]
    );
  };

  const copyCode = async () => {
    if (!card) return;
    await Clipboard.setStringAsync(card.codice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    if (!card) return;
    navigation.navigate('Aggiungi', { editId: card.id });
  };

  const handleDelete = () => {
    if (!card) return;
    Alert.alert(t('showCode.deleteTitle'), t('showCode.deleteBody', { name: card.nome }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('showCode.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          const json = await AsyncStorage.getItem('carte');
          const carte: Carta[] = json ? JSON.parse(json) : [];
          const next = carte.filter((c) => c.id !== card.id);
          await AsyncStorage.setItem('carte', JSON.stringify(next));
          navigation.goBack();
        },
      },
    ]);
  };

  if (!card) return null;

  const brandInfo = getBrandInfo(card.nome);
  const brandColor = brandInfo?.color || card.colore || DEFAULT_CARD_COLOR;
  const logoSource = brandInfo?.logoUri ?? (card.logoFile ? logoMap[card.logoFile] : null);
  const logoFile = brandInfo?.logoFile ?? card.logoFile ?? null;
  const hasRealLogo = !!logoSource || hasCachedLogo(logoFile);
  const headerBackground = hasRealLogo ? brandInfo?.boxColor || '#FFFFFF' : brandColor;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.container}>
        <View style={styles.shadowWrap}>
          <View
            style={[
              styles.header,
              { width: headerWidth, height: headerHeight, backgroundColor: headerBackground },
              hasRealLogo && styles.headerWithLogo,
            ]}
          >
            <View style={[styles.headerLogo, hasRealLogo && styles.headerLogoWithPadding]}>
              <BrandLogo brand={card.nome} color={brandColor} logoSource={logoSource} logoFile={logoFile} icon={hasRealLogo ? null : card.icon} />
            </View>
          </View>
        </View>
        <View style={styles.nameBadge}>
          <Text style={styles.nameText}>{card.nome}</Text>
        </View>

        <View style={styles.barcodeContainer}>
          <Barcode
            value={card.codice}
            format={format}
            singleBarWidth={2}
            maxWidth={barcodeWidth}
            height={110}
            lineColor="#000000"
            backgroundColor="#ffffff"
            // Alcuni codici non rispettano il checksum del formato numerico rilevato
            // (es. numeri tessera a 13 cifre non EAN13 validi): in quel caso usiamo
            // CODE128, che accetta qualunque valore alfanumerico.
            onError={() => setFormat('CODE128')}
          />
          <Text style={styles.code}>{card.codice}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={copyCode}>
            <Text style={styles.actionIcon}>{copied ? '✅' : '📋'}</Text>
            <Text style={styles.actionText}>{copied ? t('showCode.copied') : t('showCode.copyCode')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>{t('showCode.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionText, styles.deleteText]}>{t('showCode.delete')}</Text>
          </TouchableOpacity>
        </View>

        {card.prestataDa && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t('showCode.borrowedFrom', { name: card.prestataDa })}</Text>
          </View>
        )}

        {!!card.prestiti?.length && (
          <View style={styles.lendListBox}>
            <Text style={styles.lendListTitle}>{t('showCode.lentToTitle')}</Text>
            {card.prestiti.map((p) => (
              <View key={p.destinatario} style={styles.lendRow}>
                <Text style={styles.lendRowText}>
                  {t('showCode.lentToRow', {
                    name: p.destinatario,
                    expiry: p.scadenza ? t('common.until', { date: formatDateIt(p.scadenza) }) : t('common.noExpiry'),
                  })}
                </Text>
                <TouchableOpacity onPress={() => removePrestito(p.destinatario)}>
                  <Text style={styles.lendRowRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AdBanner style={styles.adBanner} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#121212' },
  scrollFlex: { flex: 1 },
  container: { flexGrow: 1, paddingTop: 32, paddingBottom: 24, alignItems: 'center' },
  shadowWrap: {
    borderRadius: 18,
    shadowColor: '#FDD835',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 12,
  },
  headerWithLogo: {
    borderWidth: 1,
    borderColor: '#333',
  },
  headerLogo: {
    width: '100%',
    height: '70%',
  },
  headerLogoWithPadding: {
    width: '80%',
    height: '55%',
  },
  nameBadge: {
    backgroundColor: '#2C2C2C',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 14,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9800',
    textAlign: 'center',
  },
  barcodeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  code: { marginTop: 16, fontSize: 18, letterSpacing: 1.5, color: '#1E1E1E' },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    margin: 6,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ccc',
  },
  deleteText: {
    color: '#FF5252',
  },
  infoBox: {
    marginTop: 20,
    backgroundColor: '#2C2600',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD54F',
  },
  lendListBox: {
    marginTop: 20,
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
  },
  lendListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#aaa',
    marginBottom: 8,
  },
  lendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  lendRowText: {
    fontSize: 13,
    color: '#ccc',
    flex: 1,
    marginRight: 8,
  },
  lendRowRemove: {
    fontSize: 15,
    color: '#FF5252',
    fontWeight: '700',
    padding: 4,
  },
  adBanner: {
    alignSelf: 'center',
    width: '85%',
    marginTop: 8,
    marginBottom: 16,
  },
});
