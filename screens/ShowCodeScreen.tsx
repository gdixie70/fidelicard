import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import Barcode from 'react-native-barcode-svg';
import { detectBarcodeFormat, BarcodeFormat } from '../utils/barcodeFormat';

type Carta = {
  nome: string;
  codice: string;
  uso?: number;
};

type Params = {
  params: {
    index: number;
  };
};

const BARCODE_WIDTH = Dimensions.get('window').width - 80;

export default function ShowCodeScreen() {
  const route = useRoute<RouteProp<Params>>();
  const [card, setCard] = useState<Carta | null>(null);
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const index = route.params.index;

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    const json = await AsyncStorage.getItem('carte');
    if (json) {
      const carte: Carta[] = JSON.parse(json);
      const selected = carte[index];

      // aggiorna contatore uso
      const uso = selected.uso ? selected.uso + 1 : 1;
      carte[index] = { ...selected, uso };
      await AsyncStorage.setItem('carte', JSON.stringify(carte));

      setCard(carte[index]);
      setFormat(detectBarcodeFormat(carte[index].codice));
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
});
