// CarteScreen.tsx con animazione e colori Fidelicard + delay + sfondo logo semi-trasparente visibile sempre
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  Animated as RNAnimated,
  Platform,
  AppState,
  DeviceEventEmitter,
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
import { loadAllCards, saveAllCards, CARDS_CHANGED_EVENT } from '../utils/cardStore';
import { isExpired } from '../utils/duration';
import { Carta } from '../utils/types';
import CardTile from '../components/CardTile';
import AdBanner from '../components/AdBanner';
import { t } from '../utils/i18n';

const AnimatedPath = Reanimated.createAnimatedComponent(Path);

export default function CarteScreen() {
  const [carte, setCarte] = useState<Carta[]>([]);
  const [filtro, setFiltro] = useState('');
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

  // Una tessera ricevuta in prestito viene aggiunta da LendRequestHandler,
  // montato fuori da questa schermata: senza questo listener la Home resta
  // ferma alla lista vecchia finché non si cambia sezione e si torna qui.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(CARDS_CHANGED_EVENT, loadCards);
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

  const handlePress = (id: string) => {
    navigation.navigate('MostraCodice', { id });
  };

  const filteredCards = carte.filter((carta) =>
    carta.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const renderItem = ({ item }: { item: Carta }) => {
    const prestitiAttivi = (item.prestiti || []).length;
    const badge = prestitiAttivi > 0 ? (
      <View style={styles.lendBadge}>
        <Text style={styles.lendBadgeText}>
          {t('carte.lentBadge')}{prestitiAttivi > 1 ? ` (${prestitiAttivi})` : ''}
        </Text>
      </View>
    ) : item.prestataDa ? (
      <View style={styles.borrowedBadge}>
        <Text style={styles.borrowedBadgeText}>{t('carte.borrowedBadge')}</Text>
      </View>
    ) : null;

    return <CardTile carta={item} onPress={() => handlePress(item.id)} badge={badge} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.backgroundLogo} />

      <TextInput
        style={styles.searchInput}
        placeholder={t('carte.searchPlaceholder')}
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
          <Text style={styles.emptyText} accessibilityLabel={t('carte.emptyAccessibility')}>
            {t('carte.emptyText')}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.listFlex}
          data={filteredCards}
          key={'2-columns'}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}

      <AdBanner style={styles.adBanner} />
    </SafeAreaView>
  );
}

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
  listFlex: {
    flex: 1,
  },
  list: {
    paddingBottom: 20,
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
  adBanner: {
    marginTop: 8,
    marginBottom: 4,
  },
});
