import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CarteScreen from './screens/CarteScreen';
import CollaboraScreen from './screens/CollaboraScreen';
import AddCardScreen from './screens/AddCardScreen';
import ShowCodeScreen from './screens/ShowCodeScreen';
import ScanCodeScreen from './screens/ScanCodeScreen';
import BulkImportScreen from './screens/BulkImportScreen';
import AboutScreen from './screens/AboutScreen';
import { TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { initRemoteBrands } from './utils/remoteBrands';
import LendRequestHandler from './components/LendRequestHandler';
import { initializeAdsWithConsent } from './utils/ads';
import ActionSheet, { ActionSheetItem } from './components/ActionSheet';
import InviteQrModal from './components/InviteQrModal';
import { t } from './utils/i18n';

// Tab centrale "Invita": non ha una vera schermata, l'onPress viene
// intercettato in Tab.Screen "Invita" (listeners.tabPress) per aprire il
// QR invece di navigare.
function EmptyScreen() {
  return null;
}

export type RootStackParamList = {
  Home: undefined;
  Aggiungi: { scannedCode?: string; editId?: string } | undefined;
  MostraCodice: { id: string };
  ScanCodice: undefined;
  ImportaMassivo: undefined;
  Info: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Custom theme to remove iOS line
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    border: 'transparent',
  },
};

function Tabs({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const addActions: ActionSheetItem[] = [
    { key: 'single', icon: '➕', label: t('app.addCard'), onPress: () => navigation.navigate('Aggiungi') },
    { key: 'bulk', icon: '📥', label: t('app.importBulk'), onPress: () => navigation.navigate('ImportaMassivo') },
  ];

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' },
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#FF9800', // ← Titolo giallo/arancione
          },
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopWidth: 0, // ← Rimuove la linea
            elevation: 0,       // ← Android compatibilità
          },
          tabBarActiveTintColor: '#FF9800',
          tabBarInactiveTintColor: '#888',
        }}
      >
        <Tab.Screen
          name="Carte"
          component={CarteScreen}
          options={{
            title: 'FideliCard',
            tabBarLabel: t('tabs.home'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.navigate('Info')} style={{ marginLeft: 15 }}>
                <Ionicons name="help-circle-outline" size={26} color="#FF9800" />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={() => setAddMenuVisible(true)}>
                <Text style={{ fontSize: 26, marginRight: 15, color: '#FF9800' }}>＋</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="Invita"
          component={EmptyScreen}
          options={{
            title: t('tabs.invite'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="qr-code-outline" size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setQrVisible(true);
            },
          }}
        />
        <Tab.Screen
          name="Collabora"
          component={CollaboraScreen}
          options={{
            title: t('tabs.collabora'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'handshake' : 'handshake-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
      <ActionSheet visible={addMenuVisible} items={addActions} onClose={() => setAddMenuVisible(false)} />
      <InviteQrModal visible={qrVisible} onClose={() => setQrVisible(false)} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Aggiorna l'elenco brand da GitHub in background: l'app mostra subito
    // quello incluso nel pacchetto (o l'ultima copia in cache), senza
    // aspettare la rete.
    initRemoteBrands();

    // In Expo Go il modulo nativo degli annunci non esiste: inizializzarlo
    // manderebbe in crash l'app. Gestisce da sola ATT + consenso GDPR prima
    // di inizializzare l'SDK (vedi utils/ads.ts).
    initializeAdsWithConsent();
  }, []);

  return (
    <NavigationContainer theme={MyTheme}>
      <LendRequestHandler />
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Aggiungi"
          component={AddCardScreen}
          options={{ title: t('app.screenTitle.addCard') }}
        />
        <Stack.Screen
          name="MostraCodice"
          component={ShowCodeScreen}
          options={{ title: t('app.screenTitle.showCode') }}
        />
        <Stack.Screen
          name="ScanCodice"
          component={ScanCodeScreen}
          options={{ title: t('app.screenTitle.scan') }}
        />
        <Stack.Screen
          name="ImportaMassivo"
          component={BulkImportScreen}
          options={{ title: t('app.screenTitle.bulkImport') }}
        />
        <Stack.Screen
          name="Info"
          component={AboutScreen}
          options={{ title: t('app.screenTitle.info') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
