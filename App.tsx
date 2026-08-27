import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CarteScreen from './screens/CarteScreen';
import AddCardScreen from './screens/AddCardScreen';
import ShowCodeScreen from './screens/ShowCodeScreen';
import ScanCodeScreen from './screens/ScanCodeScreen';
import { TouchableOpacity, Text, Platform } from 'react-native';
import { initRemoteBrands } from './utils/remoteBrands';
import LendRequestHandler from './components/LendRequestHandler';

export type RootStackParamList = {
  Home: undefined;
  Aggiungi: { scannedCode?: string; editId?: string } | undefined;
  MostraCodice: { id: string };
  ScanCodice: undefined;
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
  return (
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
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Aggiungi')}>
              <Text style={{ fontSize: 26, marginRight: 15, color: '#FF9800' }}>＋</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Aggiorna l'elenco brand da GitHub in background: l'app mostra subito
    // quello incluso nel pacchetto (o l'ultima copia in cache), senza
    // aspettare la rete.
    initRemoteBrands();
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
          options={{ title: 'Aggiungi Carta' }}
        />
        <Stack.Screen
          name="MostraCodice"
          component={ShowCodeScreen}
          options={{ title: 'Codice Tessera' }}
        />
        <Stack.Screen
          name="ScanCodice"
          component={ScanCodeScreen}
          options={{ title: 'Scansiona codice' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
