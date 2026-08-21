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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { getBrandColor } from '../utils/getBrandColor';
import logoMap from '../utils/logoMap';
import BrandLogo from '../components/BrandLogo';

const AnimatedPath = Reanimated.createAnimatedComponent(Path);

type Carta = {
  nome: string;
  codice: string;
  uso?: number;
  logoFile?: string | null;
  colore?: string;
  domain?: string | null;
};

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
    const json = await AsyncStorage.getItem('carte');
    if (json) {
      const parsed: Carta[] = JSON.parse(json);
      const sorted = parsed.sort((a, b) => (b.uso || 0) - (a.uso || 0));
      setCarte(sorted);
    } else {
      setCarte([]);
    }
  };

  const saveCards = async (cards: Carta[]) => {
    await AsyncStorage.setItem('carte', JSON.stringify(cards));
    setCarte(cards);
  };

  const handlePress = (index: number) => {
    navigation.navigate('MostraCodice', { index });
  };

  const handleLongPress = (index: number) => {
    Alert.alert('Elimina Carta', `Vuoi eliminare "${carte[index].nome}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: () => {
          const nuoveCarte = [...carte];
          nuoveCarte.splice(index, 1);
          saveCards(nuoveCarte);
        },
      },
    ]);
  };

  const filteredCards = carte.filter((carta) =>
    carta.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const renderItem = ({ item, index }: { item: Carta; index: number }) => {
    const backgroundColor = item.colore || getBrandColor(item.nome);
    const logoSource = item.logoFile ? logoMap[item.logoFile] : null;

    return (
      <View style={styles.shadowContainer}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor }]}
          activeOpacity={0.85}
          onPress={() => handlePress(index)}
          onLongPress={() => handleLongPress(index)}
        >
          <View style={styles.logo}>
            <BrandLogo
              brand={item.nome}
              color={backgroundColor}
              logoSource={logoSource}
              domain={item.domain}
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
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}

      {/* Spazio riservato per un banner pubblicitario (es. AdMob) */}
      <View style={styles.adPlaceholder}>
        <Text style={styles.adPlaceholderText}>Spazio pubblicitario</Text>
      </View>
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
  logo: {
    width: '100%',
    height: '70%',
    alignSelf: 'center',
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
