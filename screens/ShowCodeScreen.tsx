import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Share, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import Barcode from 'react-native-barcode-svg';
import { detectBarcodeFormat, BarcodeFormat } from '../utils/barcodeFormat';

type Carta = {
  id: string;
  nome: string;
  codice: string;
  uso?: number;
};

type Params = {
  params: {
    id: string;
  };
};

const BARCODE_WIDTH = Dimensions.get('window').width - 80;

export default function ShowCodeScreen() {
  const route = useRoute<RouteProp<Params>>();
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

  if (!card) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{card.nome}</Text>
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
      </View>
      <Text style={styles.code}>{card.codice}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={copyCode}>
          <Text style={styles.actionIcon}>{copied ? '✅' : '📋'}</Text>
          <Text style={styles.actionText}>{copied ? 'Copiato' : 'Copia codice'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={shareCode}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Condividi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  barcodeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  code: { marginTop: 20, fontSize: 18, letterSpacing: 1.5 },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 30,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 8,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});
