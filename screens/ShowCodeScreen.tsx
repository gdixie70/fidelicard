import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';

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

export default function ShowCodeScreen() {
  const route = useRoute<RouteProp<Params>>();
  const [card, setCard] = useState<Carta | null>(null);
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
    }
  };

  if (!card) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{card.nome}</Text>
      <View style={styles.qrContainer}>
        <QRCode value={card.codice} size={200} />
      </View>
      <Text style={styles.code}>{card.codice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  code: { marginTop: 20, fontSize: 18, letterSpacing: 1.5 },
});
