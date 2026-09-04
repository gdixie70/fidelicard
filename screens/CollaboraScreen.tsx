import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  AppState,
  Platform,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBrandInfo } from '../utils/brandSearch';
import { hasCachedLogo } from '../utils/brandLogo';
import logoMap from '../utils/logoMap';
import { loadAllCards, updateCardById } from '../utils/cardStore';
import { DURATION_OPTIONS, computeExpiryDate, formatDateIt, isExpired } from '../utils/duration';
import { buildLendLink } from '../utils/lendLink';
import { getMyName, setMyName } from '../utils/profile';
import { Carta, Prestito } from '../utils/types';
import BrandLogo from '../components/BrandLogo';
import ActionSheet, { ActionSheetItem } from '../components/ActionSheet';
import PromptModal from '../components/PromptModal';
import AdBanner from '../components/AdBanner';

const DEFAULT_CARD_COLOR = '#1E1E1E';

type PendingLend = {
  card: Carta;
  optionKey: string;
};

export default function CollaboraScreen() {
  const [carte, setCarte] = useState<Carta[]>([]);
  const [myName, setMyNameState] = useState<string | null>(null);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [lendCardId, setLendCardId] = useState<string | null>(null);
  const [pendingLend, setPendingLend] = useState<PendingLend | null>(null);
  const [askRecipient, setAskRecipient] = useState(false);
  // Carta su cui l'utente ha toccato "presta" prima ancora di aver
  // impostato il proprio nome: la riprendiamo appena l'onboarding finisce,
  // senza fargli toccare la carta una seconda volta.
  const [cardAwaitingName, setCardAwaitingName] = useState<Carta | null>(null);
  // Testo da condividere non appena il prompt del destinatario si è
  // davvero chiuso (vedi handleRecipientModalDismissed): su iOS aprire il
  // foglio di condivisione troppo presto, mentre l'animazione di chiusura
  // del Modal precedente è ancora in corso, lo fa fallire in silenzio.
  const [pendingShareMessage, setPendingShareMessage] = useState<string | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) refresh();
  }, [isFocused]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, []);

  const refresh = async () => {
    const parsed = await loadAllCards();
    setCarte(parsed.filter((c) => !isExpired(c.scadenza)));
    setMyNameState(await getMyName());
  };

  const handleOnboardingConfirmed = async (name: string) => {
    await setMyName(name);
    setMyNameState(name);
    setOnboardingVisible(false);

    if (cardAwaitingName) {
      const card = cardAwaitingName;
      setCardAwaitingName(null);
      setTimeout(() => setLendCardId(card.id), 400);
    }
  };

  // --- Flusso "Presta la tessera": durata -> nome destinatario -> condivisione ---

  const handleLendPress = (card: Carta) => {
    if (!myName) {
      setCardAwaitingName(card);
      setOnboardingVisible(true);
      return;
    }
    setLendCardId(card.id);
  };

  const handleLendDurationChosen = (card: Carta, optionKey: string) => {
    setPendingLend({ card, optionKey });
    setTimeout(() => setAskRecipient(true), 400);
  };

  const handleRecipientConfirmed = async (recipientName: string) => {
    setAskRecipient(false);
    if (!pendingLend) return;

    const { card, optionKey } = pendingLend;
    const option = DURATION_OPTIONS.find((o) => o.key === optionKey);
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
      da: myName || '',
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
    const next = await updateCardById(card.id, { prestiti: [...prestitiPrecedenti, nuovoPrestito] });
    setCarte(next.filter((c) => !isExpired(c.scadenza)));

    const scadenzaTesto = scadenzaIso ? `fino al ${formatDateIt(scadenzaIso)}` : 'senza scadenza';
    const message = `Ti presto la tessera ${card.nome} (${scadenzaTesto}). Tocca per aggiungerla in FideliCard: ${link}`;

    setPendingLend(null);
    if (Platform.OS === 'ios') {
      // Il Modal del destinatario è già in fase di chiusura (setAskRecipient
      // sopra): aspettiamo che l'animazione finisca davvero (onDismiss) prima
      // di aprire il foglio di condivisione, altrimenti iOS lo apre a vuoto.
      setPendingShareMessage(message);
    } else {
      setTimeout(() => shareLendMessage(message), 400);
    }
  };

  const shareLendMessage = async (message: string) => {
    try {
      await Share.share({ message });
    } catch (err) {
      console.warn('Condivisione del prestito non riuscita', err);
    }
  };

  const handleRecipientModalDismissed = () => {
    if (!pendingShareMessage) return;
    const message = pendingShareMessage;
    setPendingShareMessage(null);
    shareLendMessage(message);
  };

  const removePrestito = (card: Carta, destinatario: string) => {
    Alert.alert(
      "Togliere dall'elenco?",
      `"${destinatario}" verrà tolto dall'elenco di chi ha ricevuto questa tessera in prestito (è solo un promemoria: la sua copia non viene toccata).`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Togli',
          style: 'destructive',
          onPress: async () => {
            const nuoviPrestiti = (card.prestiti || []).filter((p) => p.destinatario !== destinatario);
            const next = await updateCardById(card.id, { prestiti: nuoviPrestiti });
            setCarte(next.filter((c) => !isExpired(c.scadenza)));
          },
        },
      ]
    );
  };

  const lendCard = lendCardId ? carte.find((c) => c.id === lendCardId) ?? null : null;
  const durationActions: ActionSheetItem[] = lendCard
    ? DURATION_OPTIONS.map((option) => ({
        key: option.key,
        label: option.label,
        onPress: () => handleLendDurationChosen(lendCard, option.key),
      }))
    : [];

  // Non ha senso ri-prestare una tessera che stai già usando in prestito da
  // qualcun altro: qui mostriamo solo le tue tessere "vere".
  const carteProprie = carte.filter((c) => !c.prestataDa);
  const carteChePresti = carte.filter((c) => (c.prestiti || []).length > 0);
  const carteRicevute = carte.filter((c) => !!c.prestataDa);

  const renderMiniLogo = (item: Carta) => {
    const brandInfo = getBrandInfo(item.nome);
    const brandColor = brandInfo?.color || item.colore || DEFAULT_CARD_COLOR;
    const logoSource = brandInfo?.logoUri ?? (item.logoFile ? logoMap[item.logoFile] : null);
    const logoFile = brandInfo?.logoFile ?? item.logoFile ?? null;
    const hasRealLogo = !!logoSource || hasCachedLogo(logoFile);
    return (
      <View style={[styles.miniLogoBox, hasRealLogo ? styles.miniLogoBoxWhite : { backgroundColor: brandColor }]}>
        <BrandLogo brand={item.nome} color={brandColor} logoSource={logoSource} logoFile={logoFile} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Presta le tue tessere a chi ti sta vicino, o tieni traccia di chi ti ha prestato le sue — utile se vi
          dividete i punti di negozi diversi.
        </Text>

        <Text style={styles.sectionTitle}>Presta una tessera</Text>
        {carteProprie.length === 0 ? (
          <Text style={styles.emptyHint}>Non hai ancora nessuna tessera da prestare.</Text>
        ) : (
          <View style={styles.grid}>
            {carteProprie.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.lendTile}
                onPress={() => handleLendPress(item)}
              >
                {renderMiniLogo(item)}
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {item.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {carteChePresti.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⭐ Prestate da te</Text>
            {carteChePresti.map((card) => (
              <View key={card.id} style={styles.listBox}>
                <Text style={styles.listBoxTitle}>{card.nome}</Text>
                {(card.prestiti || []).map((p) => (
                  <View key={p.destinatario} style={styles.lendRow}>
                    <Text style={styles.lendRowText}>
                      {p.destinatario} — {p.scadenza ? `fino al ${formatDateIt(p.scadenza)}` : 'senza scadenza'}
                    </Text>
                    <TouchableOpacity onPress={() => removePrestito(card, p.destinatario)}>
                      <Text style={styles.lendRowRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {carteRicevute.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>💛 Ricevute in prestito</Text>
            {carteRicevute.map((card) => (
              <View key={card.id} style={styles.listBox}>
                <Text style={styles.listBoxTitle}>{card.nome}</Text>
                <Text style={styles.lendRowText}>Prestata da {card.prestataDa}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <AdBanner style={styles.adBanner} />

      <ActionSheet
        visible={!!lendCard}
        title="Per quanto tempo?"
        items={durationActions}
        onClose={() => setLendCardId(null)}
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
        onDismiss={handleRecipientModalDismissed}
      />
      <PromptModal
        visible={onboardingVisible}
        title="Come ti chiami? Lo vedrà chi riceve una tua tessera in prestito, così sa che sei stato tu a mandarla. Non leggiamo nessun'altra impostazione o dato del telefono."
        placeholder="Il tuo nome"
        confirmLabel="Continua"
        onConfirm={handleOnboardingConfirmed}
        onCancel={() => {
          setOnboardingVisible(false);
          setCardAwaitingName(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollFlex: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 20,
  },
  intro: {
    fontSize: 13,
    color: '#999',
    lineHeight: 19,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9800',
    marginTop: 12,
    marginBottom: 10,
  },
  emptyHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lendTile: {
    width: 84,
    alignItems: 'center',
    marginRight: 14,
    marginBottom: 14,
  },
  miniLogoBox: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 6,
  },
  miniLogoBoxWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  tileLabel: {
    fontSize: 11,
    color: '#ccc',
    textAlign: 'center',
  },
  listBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  listBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  lendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  lendRowText: {
    fontSize: 13,
    color: '#ccc',
    flex: 1,
    marginRight: 8,
  },
  lendRowRemove: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: '700',
    padding: 4,
  },
  adBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
});
