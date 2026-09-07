import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AdBanner from '../components/AdBanner';

type Step = { icon: string; title: string; text: string };
type Point = { icon: string; title: string; text: string };

const STEPS: Step[] = [
  {
    icon: 'add-circle-outline',
    title: 'Aggiungi una tessera',
    text: 'Scansiona il codice a barre dal vivo, importalo da una foto o da uno screenshot, oppure scrivi il numero a mano se non hai la tessera con te.',
  },
  {
    icon: 'images-outline',
    title: 'Importa più tessere insieme',
    text: 'Vieni da un\'altra app e vuoi spostare tutte le tue tessere? Fai uno screenshot di ognuna, selezionale tutte insieme da "Importa più tessere da foto" e controllale prima di salvare - niente da rifare una alla volta.',
  },
  {
    icon: 'barcode-outline',
    title: 'Mostrala in cassa',
    text: 'Tocca la tessera dalla Home: codice a barre e numero grandi e leggibili, pronti da inquadrare.',
  },
  {
    icon: 'people-outline',
    title: 'Condividi con chi vuoi',
    text: 'Dalla pagina Collabora presti una tessera a un familiare o un amico, per il tempo che preferisci - utile per dividervi i punti di negozi diversi.',
  },
];

const MANIFESTO: Point[] = [
  {
    icon: 'lock-closed-outline',
    title: 'Le tue tessere restano tue',
    text: 'Niente account, niente server: tutto quello che aggiungi resta salvato solo sul tuo telefono.',
  },
  {
    icon: 'apps-outline',
    title: 'Ogni tipo di tessera',
    text: 'Supermercati, benzinai, farmacie, negozi di quartiere, programmi punti - non solo le grandi catene.',
  },
  {
    icon: 'cloud-offline-outline',
    title: 'Funziona anche offline',
    text: 'Il codice a barre si vede sempre, anche senza connessione: in cassa non deve mai dipendere dal wifi del negozio.',
  },
  {
    icon: 'flash-outline',
    title: 'Veloce e senza fronzoli',
    text: 'Apri l\'app, tocchi la tessera, mostri il codice. Fatto.',
  },
  {
    icon: 'card-outline',
    title: 'Solo tessere fedeltà, niente altro',
    text: 'Non è un\'app di pagamenti e non è una carta di credito: non ti chiediamo mai dati bancari, e non ti spingiamo verso altri servizi.',
  },
  {
    icon: 'sync-outline',
    title: 'Loghi sempre aggiornati',
    text: 'Il database dei negozi si aggiorna da solo in background: nuovi brand e loghi arrivano senza bisogno di aggiornare l\'app.',
  },
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.container}>
        <Text style={styles.heroTitle}>Le tue tessere fedeltà,{'\n'}tutte in un posto solo</Text>
        <Text style={styles.heroSubtitle}>
          FideliCard raccoglie tutte le tue tessere fedeltà in un'unica app semplice e veloce - senza account, senza
          dati che escono dal telefono, senza trasformarsi in altro.
        </Text>

        <Text style={styles.sectionTitle}>Come funziona</Text>
        {STEPS.map((step) => (
          <View key={step.title} style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name={step.icon as any} size={22} color="#FF9800" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{step.title}</Text>
              <Text style={styles.rowBody}>{step.text}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Perché FideliCard</Text>
        {MANIFESTO.map((point) => (
          <View key={point.title} style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name={point.icon as any} size={22} color="#FF9800" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{point.title}</Text>
              <Text style={styles.rowBody}>{point.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <AdBanner style={styles.adBanner} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#121212' },
  scrollFlex: { flex: 1 },
  container: { padding: 20, paddingBottom: 12 },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF9800',
    lineHeight: 30,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 28,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  rowBody: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  adBanner: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
});
