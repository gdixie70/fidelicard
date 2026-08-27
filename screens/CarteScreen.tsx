// CarteScreen.tsx con animazione e colori Fidelicard + delay + sfondo logo semi-trasparente visibile sempre
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  TextInput,
  Image,
  Animated as RNAnimated,
  Platform,
  Share,
  AppState,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Reanimated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Contacts from 'expo-contacts';
import logoMap from '../utils/logoMap';
import { getBrandInfo } from '../utils/brandSearch';
import { hasCachedLogo } from '../utils/brandLogo';
import { loadAllCards, saveAllCards } from '../utils/cardStore';
import { DURATION_OPTIONS, computeExpiryDate, formatDateIt, isExpired } from '../utils/duration';
import { buildLendLink } from '../utils/lendLink';
import { getMyName, setMyName } from '../utils/profile';
import { Carta, Prestito } from '../utils/types';
import BrandLogo from '../components/BrandLogo';
import ActionSheet, { ActionSheetItem } from '../components/ActionSheet';
import PromptModal from '../components/PromptModal';

const DEFAULT_CARD_COLOR = '#1E1E1E';

const AnimatedPath = Reanimated.createAnimatedComponent(Path);

type PendingLend = {
  card: Carta;
  optionKey: string;
};

export default function CarteScreen() {
  const [carte, setCarte] = useState<Carta[]>([]);
  const [filtro, setFiltro] = useState('');
  const [menuCardId, setMenuCardId] = useState<string | null>(null);
  const [lendCardId, setLendCardId] = useState<string | null>(null);
  const [pendingLend, setPendingLend] = useState<PendingLend | null>(null);
  const [askMyName, setAskMyName] = useState(false);
  const [askRecipient, setAskRecipient] = useState(false);
  const [recipientChoiceVisible, setRecipientChoiceVisible] = useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const strokeDashoffset = useSharedValue(1000);

  useEffect(() => {
    if (isFocused) {
      loadCards();
    }
  }, [isFocused]);

  // Se l'app torna in primo piano (es. dopo aver toccato un link di
  // prestito ricevuto mentre eravamo in un'altra app), ricarica l'elenco:
  // la nuova carta potrebbe essere stata aggiunta nel frattempo.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadCards();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (carte.length === 0) {
      strokeDashoffset.value = withRepeat(
        withTiming(0, { duration: 1200 }),
        -1,
        true
      );
    }
  }, [carte]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  const loadCards = async () => {
    const parsed = await loadAllCards();
    let changed = false;

    // Rimuove automaticamente le carte con una scadenza superata (es. una
    // tessera ricevuta in prestito con una durata concordata).
    const active = parsed.filter((c) => !isExpired(c.scadenza));
    if (active.length !== parsed.length) changed = true;

    if (changed) {
      await saveAllCards(active);
    }

    const sorted = [...active].sort((a, b) => (b.uso || 0) - (a.uso || 0));
    setCarte(sorted);
  };

  const saveCards = async (cards: Carta[]) => {
    await saveAllCards(cards);
    setCarte(cards);
  };

  const updateCard = async (id: string, changes: Partial<Carta>) => {
    const stored = await loadAllCards();
    const next = stored.map((c) => (c.id === id ? { ...c, ...changes } : c));
    await saveCards(next);
  };

  const handlePress = (id: string) => {
    navigation.navigate('MostraCodice', { id });
  };

  const handleLongPress = (id: string) => {
    setMenuCardId(id);
  };

  const handleCopyCode = async (card: Carta) => {
    await Clipboard.setStringAsync(card.codice);
    Alert.alert('Copiato', `Codice di "${card.nome}" copiato negli appunti.`);
  };

  const handleEdit = (card: Carta) => {
    navigation.navigate('Aggiungi', { editId: card.id });
  };

  const handleDeleteConfirm = (card: Carta) => {
    Alert.alert('Elimina Carta', `Vuoi eliminare "${card.nome}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: () => {
          const nuoveCarte = carte.filter((c) => c.id !== card.id);
          saveCards(nuoveCarte);
        },
      },
    ]);
  };

  // --- Flusso "Presta la tessera": durata -> (nome mio, se non impostato) -> nome destinatario -> condivisione ---

  const handleLendPress = (card: Carta) => {
    setLendCardId(card.id);
  };

  const handleLendDurationChosen = async (card: Carta, optionKey: string) => {
    setPendingLend({ card, optionKey });
    const myName = await getMyName();
    if (myName) {
      setTimeout(() => setRecipientChoiceVisible(true), 300);
    } else {
      setTimeout(() => setAskMyName(true), 300);
    }
  };

  const handleMyNameConfirmed = async (name: string) => {
    await setMyName(name);
    setAskMyName(false);
    setTimeout(() => setRecipientChoiceVisible(true), 300);
  };

  // Sceglie il destinatario dalla rubrica (uguale su iOS e Android). Se
  // l'utente annulla o nega il permesso, si può comunque scrivere il nome
  // a mano - il prestito non richiede che il destinatario sia in rubrica.
  const pickRecipient = async () => {
    if (Platform.OS === 'android') {
      const permission = await Contacts.requestPermissionsAsync();
      if (!permission.granted) {
        setAskRecipient(true);
        return;
      }
    }

    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (contact?.name) {
        handleRecipientConfirmed(contact.name);
      }
      // contact null = l'utente ha annullato il selettore: non forziamo
      // l'inserimento manuale, può riprovare da "Presta la tessera".
    } catch {
      setAskRecipient(true);
    }
  };

  const handleRecipientConfirmed = async (recipientName: string) => {
    setAskRecipient(false);
    if (!pendingLend) return;

    const { card, optionKey } = pendingLend;
    const option = DURATION_OPTIONS.find((o) => o.key === optionKey);
    const myName = (await getMyName()) || '';
    const expiry = option ? computeExpiryDate(option) : null;
    const scadenzaIso = expiry ? expiry.toISOString() : null;

    const brandInfo = getBrandInfo(card.nome);
    const logoFile = brandInfo?.logoFile ?? card.logoFile ?? null;
    const colore = brandInfo?.color || card.colore || DEFAULT_CARD_COLOR;

    const link = buildLendLink({
      nome: card.nome,
      codice: card.codice,
      logoFile,
      colore,
      da: myName,
      scadenza: scadenzaIso,
    });

    const nuovoPrestito: Prestito = {
      destinatario: recipientName,
      concessoIl: new Date().toISOString(),
      scadenza: scadenzaIso,
    };
    // Se avevi già prestato questa carta alla stessa persona, aggiorna la
    // riga invece di duplicarla.
    const prestitiPrecedenti = (card.prestiti || []).filter(
      (p) => p.destinatario.toLowerCase() !== recipientName.toLowerCase()
    );
    await updateCard(card.id, { prestiti: [...prestitiPrecedenti, nuovoPrestito] });

    const scadenzaTesto = scadenzaIso ? `fino al ${formatDateIt(scadenzaIso)}` : 'senza scadenza';

    setPendingLend(null);
    setTimeout(async () => {
      try {
        await Share.share({
          message: `Ti presto la tessera ${card.nome} (${scadenzaTesto}). Tocca per aggiungerla in FideliCard: ${link}`,
        });
      } catch {
        // l'utente ha semplicemente chiuso il foglio di condivisione
      }
    }, 300);
  };

  const filteredCards = carte.filter((carta) =>
    carta.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const menuCard = menuCardId ? carte.find((c) => c.id === menuCardId) ?? null : null;
  const lendCard = lendCardId ? carte.find((c) => c.id === lendCardId) ?? null : null;

  const cardActions: ActionSheetItem[] = menuCard
    ? [
        { key: 'copy', icon: '📋', label: 'Copia codice', onPress: () => handleCopyCode(menuCard) },
        { key: 'edit', icon: '✏️', label: 'Modifica', onPress: () => handleEdit(menuCard) },
        { key: 'lend', icon: '🤝', label: 'Presta la tessera', onPress: () => handleLendPress(menuCard) },
        {
          key: 'delete',
          icon: '🗑️',
          label: 'Elimina',
          destructive: true,
          onPress: () => handleDeleteConfirm(menuCard),
        },
      ]
    : [];

  const durationActions: ActionSheetItem[] = lendCard
    ? DURATION_OPTIONS.map((option) => ({
        key: option.key,
        label: option.label,
        onPress: () => handleLendDurationChosen(lendCard, option.key),
      }))
    : [];

  const recipientChoiceActions: ActionSheetItem[] = [
    { key: 'contacts', icon: '📇', label: 'Scegli dalla rubrica', onPress: pickRecipient },
    { key: 'manual', icon: '⌨️', label: 'Scrivi il nome', onPress: () => setAskRecipient(true) },
  ];

  const renderItem = ({ item }: { item: Carta }) => {
    // Il brand viene ricercato di nuovo ad ogni render (invece di fidarsi solo
    // dei dati salvati con la carta) così che le carte aggiunte tempo fa
    // beneficino automaticamente di correzioni/aggiunte fatte in seguito a
    // brands.json (colori, loghi, domini), senza dover ri-aggiungere la carta.
    const brandInfo = getBrandInfo(item.nome);
    const brandColor = brandInfo?.color || item.colore || DEFAULT_CARD_COLOR;
    const logoSource = brandInfo?.logoUri ?? (item.logoFile ? logoMap[item.logoFile] : null);
    const logoFile = brandInfo?.logoFile ?? item.logoFile ?? null;
    // Un logo vero ha già i suoi colori: su uno sfondo dello stesso colore del
    // brand sparisce (es. il blu di Carrefour su sfondo blu). Sfondo bianco
    // per i loghi reali, colore del brand solo per il badge con le iniziali.
    // Per i loghi non bundlati ma già recuperati in passato (cache su disco)
    // lo sappiamo subito, senza aspettare il fetch: hasCachedLogo è sincrono.
    const hasRealLogo = !!logoSource || hasCachedLogo(logoFile);
    const backgroundColor = hasRealLogo ? '#FFFFFF' : brandColor;

    const prestitiAttivi = (item.prestiti || []).length;

    return (
      <View style={styles.shadowContainer}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor }, hasRealLogo && styles.cardWithLogo]}
          activeOpacity={0.85}
          onPress={() => handlePress(item.id)}
          onLongPress={() => handleLongPress(item.id)}
        >
          {prestitiAttivi > 0 && (
            <View style={styles.lendBadge}>
              <Text style={styles.lendBadgeText}>
                ⭐ Prestata{prestitiAttivi > 1 ? ` (${prestitiAttivi})` : ''}
              </Text>
            </View>
          )}
          {!prestitiAttivi && item.prestataDa && (
            <View style={styles.borrowedBadge}>
              <Text style={styles.borrowedBadgeText}>💛 In prestito</Text>
            </View>
          )}
          <View style={[styles.logo, hasRealLogo && styles.logoWithPadding]}>
            <BrandLogo
              brand={item.nome}
              color={brandColor}
              logoSource={logoSource}
              logoFile={logoFile}
            />
          </View>
          <View style={styles.nameBadge}>
            <Text style={styles.nameText}>{item.nome}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.backgroundLogo} />

      <TextInput
        style={styles.searchInput}
        placeholder="Cerca una carta"
        placeholderTextColor="#aaa"
        value={filtro}
        onChangeText={setFiltro}
      />

      {filteredCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Svg width={260} height={400} style={styles.arrow}>
            <AnimatedPath
              d="M 200 340 C 260 150, 200 80, 232 20"
              stroke="#FF9800"
              strokeWidth={4}
              fill="none"
              strokeDasharray="1000"
              animatedProps={animatedProps}
            />
            <Path
              d="M225 20 L237 10 L235 30"
              fill="none"
              stroke="#FDD835"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.emptyText} accessibilityLabel="Tocca il più per aggiungere la tua prima card">
            TOCCA IL + {'\n'}PER AGGIUNGERE LA TUA PRIMA CARD
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          key={'2-columns'}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}

      {/* Spazio riservato per un banner pubblicitario (es. AdMob) */}
      <View style={styles.adPlaceholder}>
        <Text style={styles.adPlaceholderText}>Spazio pubblicitario</Text>
      </View>

      <ActionSheet
        visible={!!menuCard}
        title={menuCard?.nome}
        items={cardActions}
        onClose={() => setMenuCardId(null)}
      />
      <ActionSheet
        visible={!!lendCard}
        title="Per quanto tempo?"
        items={durationActions}
        onClose={() => setLendCardId(null)}
      />
      <ActionSheet
        visible={recipientChoiceVisible}
        title="A chi presti questa tessera?"
        items={recipientChoiceActions}
        onClose={() => setRecipientChoiceVisible(false)}
      />
      <PromptModal
        visible={askMyName}
        title="Come ti chiami? Lo vedrà chi riceve la tessera."
        placeholder="Il tuo nome"
        confirmLabel="Avanti"
        onConfirm={handleMyNameConfirmed}
        onCancel={() => {
          setAskMyName(false);
          setPendingLend(null);
        }}
      />
      <PromptModal
        visible={askRecipient}
        title="A chi presti questa tessera?"
        placeholder="Nome del destinatario"
        confirmLabel="Condividi"
        onConfirm={handleRecipientConfirmed}
        onCancel={() => {
          setAskRecipient(false);
          setPendingLend(null);
        }}
      />
    </SafeAreaView>
  );
}

const CARD_WIDTH = Dimensions.get('window').width / 2 - 20;
const CARD_HEIGHT = CARD_WIDTH / 1.586;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 10,
  },
  searchInput: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: -20,
    marginBottom: Platform.OS === 'ios' ? 15 : 15,
    color: '#fff',
  },
  list: {
    paddingBottom: 20,
  },
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
  lendBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    zIndex: 1,
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  lendBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E1E1E',
    textAlign: 'center',
  },
  borrowedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    zIndex: 1,
    backgroundColor: 'rgba(255, 214, 0, 0.95)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  borrowedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E1E1E',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FDD835',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 28,
  },
  arrow: {
    position: 'absolute',
    top: -60,
    right: 0,
  },
  adPlaceholder: {
    height: 50,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#1C1C1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adPlaceholderText: {
    fontSize: 12,
    color: '#666',
  },
});
