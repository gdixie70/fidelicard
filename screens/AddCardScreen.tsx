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
import * as ImagePicker from 'expo-image-picker';
import { scanFromURLAsync, BarcodeType } from 'expo-camera';
import { searchBrands, getBrandInfo, BrandMatch } from '../utils/brandSearch';
import logoMap from '../utils/logoMap';
import { generateId } from '../utils/id';
import { DURATION_OPTIONS, computeExpiryDate, formatDateIt } from '../utils/duration';
import { Carta } from '../utils/types';
import BrandLogo from '../components/BrandLogo';
import ActionSheet, { ActionSheetItem } from '../components/ActionSheet';
import AdBanner from '../components/AdBanner';

const DECODABLE_BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'codabar',
  'itf14',
  'qr',
];

export default function AddCardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Aggiungi'>>();
  const editId = route.params?.editId ?? null;

  const [nome, setNome] = useState('');
  const [codice, setCodice] = useState('');
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [logoUri, setLogoUri] = useState<any | null>(null);
  const [colore, setColore] = useState<string>('#1E1E1E');
  const [suggestions, setSuggestions] = useState<BrandMatch[]>([]);
  const [scadenza, setScadenza] = useState<string | null>(null);
  const [scadenzaPickerVisible, setScadenzaPickerVisible] = useState(false);
  // Nome della catena già confermato (da tap su un suggerimento o da match sul codice):
  // finché il testo coincide con questo valore, non ha senso riproporre i suggerimenti.
  const [confirmedBrand, setConfirmedBrand] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: editId ? 'Modifica Carta' : 'Aggiungi Carta' });
  }, [editId]);

  // In modalità modifica, precarica i dati della carta esistente.
  useEffect(() => {
    if (!editId) return;

    (async () => {
      const json = await AsyncStorage.getItem('carte');
      const carte: Carta[] = json ? JSON.parse(json) : [];
      const found = carte.find((c) => c.id === editId);
      if (!found) return;

      setNome(found.nome);
      setCodice(found.codice);
      setScadenza(found.scadenza ?? null);

      const info = getBrandInfo(found.nome);
      if (info) {
        setLogoFile(info.logoFile);
        setLogoUri(info.logoUri);
        setColore(info.color);
      } else {
        setLogoFile(found.logoFile ?? null);
        setLogoUri(found.logoFile ? logoMap[found.logoFile] ?? null : null);
        setColore(found.colore ?? '#1E1E1E');
      }
      setConfirmedBrand(found.nome);
    })();
  }, [editId]);

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
    setColore(info.color);
    setConfirmedBrand(info.brand);
    setSuggestions([]);
  };

  const resetBrand = () => {
    setLogoFile(null);
    setLogoUri(null);
    setColore('#1E1E1E');
    setConfirmedBrand(null);
    setSuggestions([]);
  };

  const selectSuggestion = (match: BrandMatch) => {
    setNome(match.brand);
    applyBrand(match);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permesso negato', "Consenti l'accesso alle foto per importare uno screenshot della tessera.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;

    try {
      const decoded = await scanFromURLAsync(result.assets[0].uri, DECODABLE_BARCODE_TYPES);
      if (decoded.length > 0) {
        setCodice(decoded[0].data);
      } else if (Platform.OS === 'ios') {
        // Limite di iOS: il riconoscimento da immagine statica di expo-camera
        // usa l'API Core Image, che su iOS legge solo i QR code (non i codici
        // a barre "a righe" come EAN13/Code128, i più comuni sulle tessere).
        Alert.alert(
          'Solo QR da foto su iPhone',
          "Su iPhone l'importazione da foto riconosce solo i codici QR: è un limite del sistema operativo, non dell'app. Per i codici a barre usa la fotocamera dal vivo (📷), oppure scrivi il numero a mano: di solito è stampato o mostrato subito sotto al codice."
        );
      } else {
        Alert.alert(
          'Codice non trovato',
          "Non ho riconosciuto nessun codice a barre nell'immagine. Prova con uno screenshot più nitido, inquadrando solo il codice, oppure usa la fotocamera dal vivo."
        );
      }
    } catch {
      Alert.alert('Errore', "Non sono riuscito ad analizzare l'immagine selezionata.");
    }
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

    try {
      const carteSalvate = await AsyncStorage.getItem('carte');
      const carte: Carta[] = carteSalvate ? JSON.parse(carteSalvate) : [];

      if (editId) {
        const index = carte.findIndex((c) => c.id === editId);
        if (index !== -1) {
          carte[index] = {
            ...carte[index],
            nome: nome.trim(),
            codice: codice.trim(),
            logoFile,
            colore,
            scadenza,
          };
        }
      } else {
        carte.push({
          id: generateId(),
          nome: nome.trim(),
          codice: codice.trim(),
          logoFile,
          colore,
          scadenza,
        });
      }

      await AsyncStorage.setItem('carte', JSON.stringify(carte));
      navigation.goBack();
    } catch (error) {
      console.error('Errore salvataggio:', error);
    }
  };

  const scadenzaActions: ActionSheetItem[] = DURATION_OPTIONS.map((option) => ({
    key: option.key,
    label: option.key === 'forever' ? 'Nessuna (non rimuovere mai)' : `Tra ${option.label}`,
    onPress: () => {
      const expiry = computeExpiryDate(option);
      setScadenza(expiry ? expiry.toISOString() : null);
    },
  }));

  const scadenzaLabel = scadenza ? `Rimozione automatica il ${formatDateIt(scadenza)}` : 'Nessuna rimozione automatica';

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
        autoCorrect={false}
        spellCheck={false}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((match) => (
            <TouchableOpacity
              key={match.brand}
              style={styles.suggestionRow}
              onPress={() => selectSuggestion(match)}
            >
              <View style={[styles.suggestionSwatch, match.logoUri && styles.suggestionSwatchWithLogo]}>
                <BrandLogo brand={match.brand} color={match.color} logoSource={match.logoUri} logoFile={match.logoFile} />
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
        <TouchableOpacity
          style={styles.scanButton}
          onPress={pickFromLibrary}
          accessibilityLabel="Importa il codice da una foto della libreria"
        >
          <Text style={styles.scanButtonIcon}>🖼️</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.codiceHint}>
        Non hai la tessera con te? Scrivi qui il numero che vedi stampato (o mostrato a schermo) sotto al codice a barre.
      </Text>

      {confirmedBrand && (
        <View style={[styles.preview, { backgroundColor: logoUri ? '#FFFFFF' : colore }]}>
          <View style={styles.previewLogo}>
            <BrandLogo brand={nome} color={colore} logoSource={logoUri} logoFile={logoFile} />
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.scadenzaRow} onPress={() => setScadenzaPickerVisible(true)}>
        <Text style={styles.scadenzaIcon}>⏳</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.scadenzaLabel}>{scadenzaLabel}</Text>
          <Text style={styles.scadenzaHint}>
            Utile se questa è una tessera avuta in prestito: sparisce da sola dopo la data scelta.
          </Text>
        </View>
        <Text style={styles.scadenzaChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={saveCard}>
        <Text style={styles.buttonText}>{editId ? 'Salva modifiche' : 'Salva'}</Text>
      </TouchableOpacity>

      <AdBanner style={styles.adBanner} />

      <ActionSheet
        visible={scadenzaPickerVisible}
        title="Rimuovi automaticamente"
        items={scadenzaActions}
        onClose={() => setScadenzaPickerVisible(false)}
      />
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
  suggestionSwatchWithLogo: {
    backgroundColor: '#FFFFFF',
    padding: 4,
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
  },
  codiceInput: {
    flex: 1,
  },
  scanButton: {
    width: 46,
    height: 46,
    borderRadius: 10,
    marginLeft: 10,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonIcon: {
    fontSize: 20,
  },
  codiceHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginBottom: 30,
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
  scadenzaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  scadenzaIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  scadenzaLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scadenzaHint: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  scadenzaChevron: {
    color: '#888',
    fontSize: 22,
    marginLeft: 8,
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
  adBanner: {
    marginTop: 14,
  },
});
