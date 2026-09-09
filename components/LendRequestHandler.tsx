import React, { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import { parseLendLink, LendPayload } from '../utils/lendLink';
import { acceptLentCard } from '../utils/cardStore';
import { formatDateIt } from '../utils/duration';
import { t } from '../utils/i18n';

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
      ? t('lend.untilSuffix', { date: formatDateIt(payload.scadenza) })
      : t('lend.noExpirySuffix');

    Alert.alert(
      t('lend.requestTitle'),
      t('lend.requestBody', { from: payload.da, name: payload.nome, expiry: scadenzaTesto }),
      [
        { text: t('lend.no'), style: 'cancel' },
        { text: t('lend.yesAdd'), onPress: () => acceptAndNotify(payload) },
      ]
    );
  };

  const acceptAndNotify = async (payload: LendPayload) => {
    const result = await acceptLentCard(payload);
    if (result.status === 'duplicate') {
      Alert.alert(
        t('lend.duplicateTitle'),
        t('lend.duplicateBody', { name: result.card.nome })
      );
    } else {
      Alert.alert(t('lend.doneTitle'), t('lend.doneBody', { name: payload.nome, from: payload.da }));
    }
  };

  return null;
}
