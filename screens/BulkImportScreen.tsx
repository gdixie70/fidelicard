import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { getBrandInfo, findBrandInText } from '../utils/brandSearch';
import { detectCardFromImage } from '../utils/cardImportFromImage';
import { generateId } from '../utils/id';
import { Carta } from '../utils/types';
import BrandLogo from '../components/BrandLogo';
import AdBanner from '../components/AdBanner';

const DEFAULT_CARD_COLOR = '#1E1E1E';

type DraftCard = {
  key: string;
  uri: string;
  nome: string;
  codice: string;
  logoFile: string | null;
  logoUri: any | null;
  colore: string;
  boxColor?: string;
};

export default function BulkImportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [phase, setPhase] = useState<'iniziale' | 'elaborazione' | 'revisione'>('iniziale');
  const [progresso, setProgresso] = useState({ fatte: 0, totali: 0 });
  const [draft, setDraft] = useState<DraftCard[]>([]);

  const scegliScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permesso negato', "Consenti l'accesso alle foto per importare le tessere.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    setPhase('elaborazione');
    setProgresso({ fatte: 0, totali: result.assets.length });

    const bozze: DraftCard[] = [];
    for (const asset of result.assets) {
      const { codice, brand } = await detectCardFromImage(asset.uri);
      bozze.push({
        key: generateId(),
        uri: asset.uri,
        nome: brand?.brand ?? '',
        codice: codice ?? '',
        logoFile: brand?.logoFile ?? null,
        logoUri: brand?.logoUri ?? null,
        colore: brand?.color ?? DEFAULT_CARD_COLOR,
        boxColor: brand?.boxColor,
      });
      setProgresso((p) => ({ ...p, fatte: p.fatte + 1 }));
    }

    setDraft(bozze);
    setPhase('revisione');
  };

  const aggiornaNome = (key: string, nome: string) => {
    setDraft((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const match = getBrandInfo(nome) ?? findBrandInText(nome);
        return match
          ? { ...item, nome, logoFile: match.logoFile, logoUri: match.logoUri, colore: match.color, boxColor: match.boxColor }
          : { ...item, nome, logoFile: null, logoUri: null, colore: item.colore, boxColor: undefined };
      })
    );
  };

  const aggiornaCodice = (key: string, codice: string) => {
    setDraft((prev) => prev.map((item) => (item.key === key ? { ...item, codice } : item)));
  };

  const rimuovi = (key: string) => {
    setDraft((prev) => prev.filter((item) => item.key !== key));
  };

  const salvaTutte = async () => {
    const incomplete = draft.filter((d) => !d.nome.trim() || !d.codice.trim());
    if (incomplete.length > 0) {
      Alert.alert(
        'Alcune tessere sono incomplete',
        `${incomplete.length} tesser${incomplete.length === 1 ? 'a' : 'e'} senza nome o codice: completale o rimuovile con 🗑️ prima di salvare.`
      );
      return;
    }
    if (draft.length === 0) return;

    const carteSalvate = await AsyncStorage.getItem('carte');
    const carte: Carta[] = carteSalvate ? JSON.parse(carteSalvate) : [];

    const nuove: Carta[] = draft.map((d) => ({
      id: generateId(),
      nome: d.nome.trim(),
      codice: d.codice.trim(),
      logoFile: d.logoFile,
      colore: d.colore,
      scadenza: null,
    }));

    await AsyncStorage.setItem('carte', JSON.stringify([...carte, ...nuove]));
    navigation.popToTop();
  };

  if (phase === 'iniziale') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>Importa più tessere insieme</Text>
          <Text style={styles.introText}>
            Utile se arrivi da un'altra app (es. Klarna): fai uno screenshot di ogni tessera, poi selezionali
            tutti insieme qui. Provo a riconoscere codice e negozio di ognuna - potrai controllare e correggere
            prima di salvare.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={scegliScreenshot}>
            <Text style={styles.primaryButtonText}>Scegli gli screenshot</Text>
          </TouchableOpacity>
        </View>
        <AdBanner style={styles.adBanner} />
      </SafeAreaView>
    );
  }

  if (phase === 'elaborazione') {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['bottom']}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.progressText}>
          Analizzo le foto... {progresso.fatte}/{progresso.totali}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.scroll}>
        <Text style={styles.reviewHint}>
          Controlla nome e codice di ogni tessera prima di salvare - se qualcosa non è stato letto bene, correggilo
          qui sotto.
        </Text>
        {draft.map((item) => {
          const hasRealLogo = !!item.logoUri;
          const boxBackground = hasRealLogo ? item.boxColor || '#FFFFFF' : item.colore;
          return (
            <View key={item.key} style={styles.row}>
              <View style={[styles.rowLogo, { backgroundColor: boxBackground }]}>
                <BrandLogo brand={item.nome || '?'} color={item.colore} logoSource={item.logoUri} logoFile={item.logoFile} />
              </View>
              <View style={styles.rowFields}>
                <TextInput
                  style={styles.rowInput}
                  placeholder="Nome negozio"
                  placeholderTextColor="#888"
                  value={item.nome}
                  onChangeText={(text) => aggiornaNome(item.key, text)}
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TextInput
                  style={styles.rowInput}
                  placeholder="Codice tessera"
                  placeholderTextColor="#888"
                  value={item.codice}
                  onChangeText={(text) => aggiornaCodice(item.key, text)}
                />
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => rimuovi(item.key)}>
                <Text style={styles.removeButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.primaryButton} onPress={salvaTutte}>
        <Text style={styles.primaryButtonText}>
          Salva {draft.length} tesser{draft.length === 1 ? 'a' : 'e'}
        </Text>
      </TouchableOpacity>

      <AdBanner style={styles.adBanner} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollFlex: {
    flex: 1,
  },
  scroll: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  introBox: {
    flex: 1,
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 24,
  },
  progressText: {
    marginTop: 16,
    fontSize: 15,
    color: '#ccc',
  },
  reviewHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  rowLogo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  rowFields: {
    flex: 1,
  },
  rowInput: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#fff',
    marginBottom: 6,
  },
  removeButton: {
    padding: 8,
    marginLeft: 4,
  },
  removeButtonText: {
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#121212',
    fontWeight: '700',
  },
  adBanner: {
    marginTop: 12,
    marginBottom: 8,
  },
});
