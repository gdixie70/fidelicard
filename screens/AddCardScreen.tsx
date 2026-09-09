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
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { searchBrands, getBrandInfo, BrandMatch } from '../utils/brandSearch';
import { detectCardFromImage } from '../utils/cardImportFromImage';
import logoMap from '../utils/logoMap';
import { hasCachedLogo } from '../utils/brandLogo';
import { generateId } from '../utils/id';
import { DURATION_OPTIONS, computeExpiryDate, formatDateIt } from '../utils/duration';
import { Carta } from '../utils/types';
import BrandLogo from '../components/BrandLogo';
import ActionSheet, { ActionSheetItem } from '../components/ActionSheet';
import AdBanner from '../components/AdBanner';
import { reportMissingLogo } from '../utils/missingLogoReport';
import { t } from '../utils/i18n';

const PRESET_COLORS = [
  '#1E1E1E',
  '#E53935',
  '#FF9800',
  '#FDD835',
  '#43A047',
  '#00897B',
  '#1E88E5',
  '#5E35B1',
  '#D81B60',
  '#6D4C41',
];

// Icone generiche per categoria, da usare finché non arriva il logo vero
// del negozio. Nomi Ionicons - la stessa libreria già usata nel resto
// dell'app, nessuna dipendenza nuova.
const ICON_OPTIONS = [
  'storefront-outline',
  'cart-outline',
  'restaurant-outline',
  'cafe-outline',
  'medkit-outline',
  'shirt-outline',
  'paw-outline',
  'barbell-outline',
  'car-outline',
  'book-outline',
  'home-outline',
  'gift-outline',
  'cut-outline',
  'pricetag-outline',
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
  const [boxColor, setBoxColor] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BrandMatch[]>([]);
  const [scadenza, setScadenza] = useState<string | null>(null);
  const [scadenzaPickerVisible, setScadenzaPickerVisible] = useState(false);
  // Nome della catena già confermato (da tap su un suggerimento o da match sul codice):
  // finché il testo coincide con questo valore, non ha senso riproporre i suggerimenti.
  const [confirmedBrand, setConfirmedBrand] = useState<string | null>(null);
  const [photoSourceVisible, setPhotoSourceVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editId ? t('app.screenTitle.editCard') : t('app.screenTitle.addCard') });
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
        setBoxColor(info.boxColor);
        setIcon(null);
      } else {
        setLogoFile(found.logoFile ?? null);
        setLogoUri(found.logoFile ? logoMap[found.logoFile] ?? null : null);
        setColore(found.colore ?? '#1E1E1E');
        setBoxColor(undefined);
        setIcon(found.icon ?? null);
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
    setBoxColor(info.boxColor);
    setIcon(null);
    setConfirmedBrand(info.brand);
    setSuggestions([]);
  };

  const resetBrand = () => {
    setLogoFile(null);
    setLogoUri(null);
    setColore('#1E1E1E');
    setBoxColor(undefined);
    setIcon(null);
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
      Alert.alert(t('common.permissionDenied'), t('addCard.permissionPhotoBody'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const { codice: codiceTrovato, brand } = await detectCardFromImage(result.assets[0].uri);

    if (codiceTrovato) setCodice(codiceTrovato);
    if (brand && !nome.trim()) {
      setNome(brand.brand);
      applyBrand(brand);
    }

    if (!codiceTrovato) {
      Alert.alert(t('addCard.codeNotFoundTitle'), t('addCard.codeNotFoundBody'));
    }
  };

  // Manda una foto della tessera/del logo allo sviluppatore tramite il
  // foglio di condivisione nativo (email, WhatsApp, ecc.), per aiutarlo a
  // trovare/creare il logo quando il riconoscimento automatico non basta.
  const sendLogoPhoto = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('common.permissionDenied'),
        useCamera ? t('addCard.permissionCameraBody') : t('addCard.permissionLibraryBody')
      );
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert(t('addCard.sharingUnavailableTitle'), t('addCard.sharingUnavailableBody'));
      return;
    }

    try {
      await Sharing.shareAsync(result.assets[0].uri, {
        dialogTitle: t('addCard.missingLogoShareTitle', { name: nome.trim() }),
      });
    } catch {
      // l'utente ha semplicemente chiuso il foglio di condivisione
    }
  };

  // logoUri copre solo i loghi inclusi nel bundle: un brand aggiunto dopo
  // l'ultima pubblicazione (come Tigotà) ha comunque un logo vero, solo
  // recuperato/cacheato da GitHub - senza questo controllo l'anteprima lo
  // tratterebbe come "nessun logo trovato".
  const hasRealLogo = !!logoUri || hasCachedLogo(logoFile);

  const saveCard = async () => {
    if (!nome.trim()) {
      Alert.alert(t('common.error'), t('addCard.errorNameBody'));
      return;
    }
    if (!codice.trim()) {
      Alert.alert(t('common.error'), t('addCard.errorCodeBody'));
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
            icon: hasRealLogo ? null : icon,
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
          icon: logoUri ? null : icon,
          scadenza,
        });
      }

      await AsyncStorage.setItem('carte', JSON.stringify(carte));

      // Nessun logo riconosciuto per questo nome: segnala in automatico
      // (non blocca né rallenta il salvataggio).
      if (!hasRealLogo) {
        reportMissingLogo(nome.trim());
      }

      // Torna sempre alla Home (non un semplice "indietro"): se si arriva
      // qui dopo una scansione, un goBack lascerebbe in giro schermate
      // intermedie e la fotocamera pronta per una nuova scansione si
      // raggiungerebbe solo ripassando da capo dalla Home.
      navigation.popToTop();
    } catch (error) {
      console.error('Errore salvataggio:', error);
    }
  };

  const scadenzaActions: ActionSheetItem[] = DURATION_OPTIONS.map((option) => ({
    key: option.key,
    label: option.key === 'forever' ? t('addCard.expiryNeverOption') : t('addCard.expiryInOption', { label: option.label }),
    onPress: () => {
      const expiry = computeExpiryDate(option);
      setScadenza(expiry ? expiry.toISOString() : null);
    },
  }));

  const scadenzaLabel = scadenza
    ? t('addCard.expiryLabelSet', { date: formatDateIt(scadenza) })
    : t('addCard.expiryLabelNone');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Image source={require('../assets/logo.png')} style={styles.backgroundLogo} />

      <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.input}
        placeholder={t('addCard.namePlaceholder')}
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
              <View style={[styles.suggestionSwatch, (match.logoUri || hasCachedLogo(match.logoFile)) && styles.suggestionSwatchWithLogo]}>
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
          placeholder={t('common.cardCodePlaceholder')}
          placeholderTextColor="#aaa"
          value={codice}
          onChangeText={setCodice}
          keyboardType="default"
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('ScanCodice')}
          accessibilityLabel={t('addCard.scanAccessibility')}
        >
          <Text style={styles.scanButtonIcon}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={pickFromLibrary}
          accessibilityLabel={t('addCard.importAccessibility')}
        >
          <Text style={styles.scanButtonIcon}>🖼️</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.codiceHint}>
        {t('addCard.codeHint')}
      </Text>

      {nome.trim().length > 0 && (
        <View style={[styles.preview, { backgroundColor: hasRealLogo ? boxColor || '#FFFFFF' : colore }]}>
          <View style={styles.previewLogo}>
            <BrandLogo brand={nome} color={colore} logoSource={logoUri} logoFile={logoFile} icon={icon} />
          </View>
        </View>
      )}

      {nome.trim().length > 0 && !hasRealLogo && (
        <View style={styles.colorPickerBox}>
          <Text style={styles.colorPickerLabel}>
            {t('addCard.noLogoLabel')}
          </Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  colore === c && styles.colorSwatchSelected,
                ]}
                onPress={() => setColore(c)}
                accessibilityLabel={`Colore ${c}`}
              />
            ))}
          </View>
          <Text style={styles.colorPickerLabel}>{t('addCard.chooseIconLabel')}</Text>
          <View style={styles.iconRow}>
            {ICON_OPTIONS.map((name) => (
              <TouchableOpacity
                key={name}
                style={[styles.iconSwatch, icon === name && styles.iconSwatchSelected]}
                onPress={() => setIcon(icon === name ? null : name)}
                accessibilityLabel={name}
              >
                <Ionicons name={name as any} size={20} color={icon === name ? '#FF9800' : '#ccc'} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.sendPhotoButton} onPress={() => setPhotoSourceVisible(true)}>
            <Text style={styles.sendPhotoButtonText}>{t('addCard.sendPhotoButton')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.scadenzaRow} onPress={() => setScadenzaPickerVisible(true)}>
        <Text style={styles.scadenzaIcon}>⏳</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.scadenzaLabel}>{scadenzaLabel}</Text>
          <Text style={styles.scadenzaHint}>
            {t('addCard.expiryHint')}
          </Text>
        </View>
        <Text style={styles.scadenzaChevron}>›</Text>
      </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={saveCard}>
        <Text style={styles.buttonText}>{editId ? t('addCard.saveEdit') : t('addCard.saveNew')}</Text>
      </TouchableOpacity>

      <AdBanner style={styles.adBanner} />

      <ActionSheet
        visible={scadenzaPickerVisible}
        title={t('addCard.expirySheetTitle')}
        items={scadenzaActions}
        onClose={() => setScadenzaPickerVisible(false)}
      />
      <ActionSheet
        visible={photoSourceVisible}
        title={t('addCard.photoSheetTitle')}
        items={[
          { key: 'camera', icon: '📷', label: t('addCard.takePhoto'), onPress: () => sendLogoPhoto(true) },
          { key: 'library', icon: '🖼️', label: t('addCard.chooseFromLibrary'), onPress: () => sendLogoPhoto(false) },
        ]}
        onClose={() => setPhotoSourceVisible(false)}
      />
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  safeArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
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
  colorPickerBox: {
    marginBottom: 20,
  },
  colorPickerLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#fff',
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  iconSwatch: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconSwatchSelected: {
    borderColor: '#FF9800',
  },
  sendPhotoButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sendPhotoButtonText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '600',
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
