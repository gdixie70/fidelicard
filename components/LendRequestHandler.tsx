import React, { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import { parseLendLink, LendPayload } from '../utils/lendLink';
import { acceptLentCard } from '../utils/cardStore';
import { formatDateIt } from '../utils/duration';

/**
 * Componente "invisibile" montato alla radice dell'app: ascolta i link
 * fidelicard://prestito?... (funzionanti solo da una build vera, non da
 * Expo Go) e mostra la conferma di accettazione quando ne arriva uno.
 */
export default function LendRequestHandler() {
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      const payload = parseLendLink(url);
      if (payload) confirmAndAccept(payload);
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const confirmAndAccept = (payload: LendPayload) => {
    const scadenzaTesto = payload.scadenza
      ? ` fino al ${formatDateIt(payload.scadenza)}`
      : ', senza scadenza';

    Alert.alert(
      'Prestito tessera',
      `${payload.da} ti presta la sua tessera ${payload.nome}${scadenzaTesto}. Vuoi accettarla?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sì, aggiungila', onPress: () => acceptAndNotify(payload) },
      ]
    );
  };

  const acceptAndNotify = async (payload: LendPayload) => {
    const result = await acceptLentCard(payload);
    if (result.status === 'duplicate') {
      Alert.alert(
        'Tessera già presente',
        `Hai già una tessera con questo codice ("${result.card.nome}"): non l'ho aggiunta di nuovo.`
      );
    } else {
      Alert.alert('Fatto!', `"${payload.nome}" di ${payload.da} è stata aggiunta alle tue carte.`);
    }
  };

  return null;
}
