import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchBrands, getBrandInfo, BrandMatch } from '../utils/brandSearch';
import BrandLogo from '../components/BrandLogo';

export default function AddCardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Aggiungi'>>();
  const [nome, setNome] = useState('');
  const [codice, setCodice] = useState('');
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [logoUri, setLogoUri] = useState<any | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [colore, setColore] = useState<string>('#1E1E1E');
  const [suggestions, setSuggestions] = useState<BrandMatch[]>([]);
  // Nome della catena già confermato (da tap su un suggerimento o da match sul codice):
  // finché il testo coincide con questo valore, non ha senso riproporre i suggerimenti.
  const [confirmedBrand, setConfirmedBrand] = useState<string | null>(null);

  // Codice tornato dalla fotocamera (schermata di scansione)
  useEffect(() => {
    if (route.params?.scannedCode) {
      setCodice(route.params.scannedCode);
      navigation.setParams({ scannedCode: undefined });
    }
  }, [route.params?.scannedCode]);

  // Riconoscimento automatico dal codice tessera (es. scansionato/digitato per intero)
  useEffect(() => {
    const info = codice.trim() ? getBrandInfo(codice.trim()) : null;
    if (info) {
      setNome(info.brand);
      applyBrand(info);
    }
  }, [codice]);

  // Suggerimenti live mentre si digita il nome del negozio/catena
  useEffect(() => {
    const trimmed = nome.trim();

    if (!trimmed) {
      resetBrand();
      return;
    }

    if (confirmedBrand && trimmed.toLowerCase() === confirmedBrand.toLowerCase()) {
      setSuggestions([]);
      return;
    }

    setSuggestions(searchBrands(trimmed, 5));
  }, [nome]);

  const applyBrand = (info: BrandMatch) => {
    setLogoFile(info.logoFile);
    setLogoUri(info.logoUri);
    setDomain(info.domain);
    setColore(info.color);
    setConfirmedBrand(info.brand);
    setSuggestions([]);
  };

  const resetBrand = () => {
    setLogoFile(null);
    setLogoUri(null);
    setDomain(null);
    setColore('#1E1E1E');
    setConfirmedBrand(null);
    setSuggestions([]);
  };

  const selectSuggestion = (match: BrandMatch) => {
    setNome(match.brand);
    applyBrand(match);
  };

  const saveCard = async () => {
    if (!nome.trim()) {
      Alert.alert('Errore', 'Inserisci il nome della carta.');
      return;
    }
    if (!codice.trim()) {
      Alert.alert('Errore', 'Inserisci il codice della carta.');
      return;
    }

    const nuovaCarta = {
      nome: nome.trim(),
      codice: codice.trim(),
      logoFile,
      domain,
      colore,
    };

    try {
      const carteSalvate = await AsyncStorage.getItem('carte');
      const carte = carteSalvate ? JSON.parse(carteSalvate) : [];
      carte.push(nuovaCarta);
      await AsyncStorage.setItem('carte', JSON.stringify(carte));
      navigation.goBack();
    } catch (error) {
      console.error('Errore salvataggio:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Image source={require('../assets/logo.png')} style={styles.backgroundLogo} />

      <TextInput
        style={styles.input}
        placeholder="Nome carta"
        placeholderTextColor="#aaa"
        value={nome}
        onChangeText={setNome}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((match) => (
            <TouchableOpacity
              key={match.brand}
              style={styles.suggestionRow}
              onPress={() => selectSuggestion(match)}
            >
              <View style={styles.suggestionSwatch}>
                <BrandLogo brand={match.brand} color={match.color} logoSource={match.logoUri} domain={match.domain} />
              </View>
              <Text style={styles.suggestionText}>{match.brand}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.codiceRow}>
        <TextInput
          style={[styles.input, styles.codiceInput]}
          placeholder="Codice tessera"
          placeholderTextColor="#aaa"
          value={codice}
          onChangeText={setCodice}
          keyboardType="default"
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('ScanCodice')}
          accessibilityLabel="Scansiona il codice a barre"
        >
          <Text style={styles.scanButtonIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      {confirmedBrand && (
        <View style={[styles.preview, { backgroundColor: colore }]}>
          <View style={styles.previewLogo}>
            <BrandLogo brand={nome} color={colore} logoSource={logoUri} domain={domain} />
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={saveCard}>
        <Text style={styles.buttonText}>Salva</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  backgroundLogo: {
    position: 'absolute',
    width: 400,
    height: 400,
    opacity: 0.06,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -200 }, { translateY: -200 }],
    resizeMode: 'contain',
  },
  input: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  suggestionsBox: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#444',
  },
  suggestionSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  codiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  codiceInput: {
    flex: 1,
    marginRight: 10,
  },
  scanButton: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonIcon: {
    fontSize: 20,
  },
  preview: {
    height: 200,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FDD835',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  previewLogo: {
    width: 200,
    height: 130,
  },
  button: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    color: '#121212',
    fontWeight: '700',
  },
});
