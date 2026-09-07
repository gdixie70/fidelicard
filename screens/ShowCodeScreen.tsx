import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
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

const DEFAULT_CARD_COLOR = '#1E1E1E';

type Params = {
  params: {
    id: string;
  };
};

const BARCODE_WIDTH = Dimensions.get('window').width - 112;

export default function ShowCodeScreen() {
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
      'Togliere dall\'elenco?',
      `"${destinatario}" verrà tolto dall'elenco di chi ha ricevuto questa tessera in prestito (è solo un promemoria: la sua copia non viene toccata).`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Togli',
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

  const shareCode = async () => {
    if (!card) return;
    try {
      await Share.share({
        message: `${card.nome}: ${card.codice}`,
      });
    } catch {
      Alert.alert('Errore', 'Non sono riuscito ad aprire la condivisione.');
    }
  };

  const handleEdit = () => {
    if (!card) return;
    navigation.navigate('Aggiungi', { editId: card.id });
  };

  const handleDelete = () => {
    if (!card) return;
    Alert.alert('Elimina Carta', `Vuoi eliminare "${card.nome}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
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
          <View style={[styles.header, { backgroundColor: headerBackground }, hasRealLogo && styles.headerWithLogo]}>
            <View style={[styles.headerLogo, hasRealLogo && styles.headerLogoWithPadding]}>
              <BrandLogo brand={card.nome} color={brandColor} logoSource={logoSource} logoFile={logoFile} />
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
            maxWidth={BARCODE_WIDTH}
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
            <Text style={styles.actionText}>{copied ? 'Copiato' : 'Copia codice'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={shareCode}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Condividi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Modifica</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionText, styles.deleteText]}>Elimina</Text>
          </TouchableOpacity>
        </View>

        {card.prestataDa && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>💛 Prestata da {card.prestataDa}</Text>
          </View>
        )}

        {!!card.prestiti?.length && (
          <View style={styles.lendListBox}>
            <Text style={styles.lendListTitle}>Prestata a:</Text>
            {card.prestiti.map((p) => (
              <View key={p.destinatario} style={styles.lendRow}>
                <Text style={styles.lendRowText}>
                  ⭐ {p.destinatario} — {p.scadenza ? `fino al ${formatDateIt(p.scadenza)}` : 'senza scadenza'}
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

const HEADER_WIDTH = Dimensions.get('window').width - 80;
const HEADER_HEIGHT = HEADER_WIDTH / 2.2;

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
    width: HEADER_WIDTH,
    height: HEADER_HEIGHT,
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
