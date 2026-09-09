import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useIAP, ErrorCode } from 'expo-iap';
import { Ionicons } from '@expo/vector-icons';
import { REMOVE_ADS_SKU, getAdsRemoved, setAdsRemoved } from '../utils/iap';
import { t } from '../utils/i18n';

/**
 * Bottone "Rimuovi pubblicità" (acquisto non consumabile, una tantum).
 * Montato solo quando expo-iap è disponibile (non in Expo Go) - vedi
 * AboutScreen.tsx. Isolato in un componente a parte perché useIAP() va
 * chiamato incondizionatamente: qui può, perché l'intero componente viene
 * montato/smontato in blocco dal genitore invece di condizionare l'hook.
 */
export default function RemoveAdsButton() {
  const [owned, setOwned] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  // Errore "di sistema" (connessione allo store, fetch del prodotto,
  // ripristino) - diverso da onPurchaseError, che riguarda solo il tentativo
  // di acquisto vero e proprio. Senza questo, un fetchProducts fallito
  // lasciava il bottone disabilitato per sempre senza nessuna spiegazione.
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { connected, products, fetchProducts, requestPurchase, finishTransaction, availablePurchases, getAvailablePurchases } =
    useIAP({
      onPurchaseSuccess: async (purchase) => {
        await finishTransaction({ purchase, isConsumable: false });
        await setAdsRemoved(true);
        setOwned(true);
        setBusy(false);
      },
      onPurchaseError: (error) => {
        setBusy(false);
        if (error.code === ErrorCode.UserCancelled) return;
        if (error.code === ErrorCode.AlreadyOwned) {
          setAdsRemoved(true);
          setOwned(true);
          return;
        }
        Alert.alert(t('common.error'), error.message);
      },
      onError: (error) => {
        setBusy(false);
        setFetchError(error.message);
      },
    });

  const loadProduct = () => {
    setFetchError(null);
    fetchProducts({ skus: [REMOVE_ADS_SKU], type: 'in-app' });
    getAvailablePurchases();
  };

  useEffect(() => {
    getAdsRemoved().then(setOwned);
  }, []);

  useEffect(() => {
    if (!connected) return;
    loadProduct();
  }, [connected]);

  useEffect(() => {
    if (availablePurchases.some((p) => p.productId === REMOVE_ADS_SKU)) {
      setAdsRemoved(true);
      setOwned(true);
    }
  }, [availablePurchases]);

  const product = products.find((p) => p.id === REMOVE_ADS_SKU);

  const buy = () => {
    if (busy) return;
    setBusy(true);
    requestPurchase({
      request: {
        apple: { sku: REMOVE_ADS_SKU, quantity: 1 },
        google: { skus: [REMOVE_ADS_SKU] },
      },
      type: 'in-app',
    });
  };

  const restore = async () => {
    setBusy(true);
    setFetchError(null);
    await getAvailablePurchases();
    setBusy(false);
  };

  if (owned) {
    return (
      <View style={styles.ownedRow}>
        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
        <Text style={styles.ownedText}>{t('removeAds.owned')}</Text>
      </View>
    );
  }

  // Ancora connettendosi allo store, o prodotto non ancora arrivato e nessun
  // errore riportato: probabile solo lentezza di rete, non un guasto.
  const loading = !connected || (!product && !fetchError);

  return (
    <View>
      {fetchError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity onPress={loadProduct}>
            <Text style={styles.retryText}>{t('removeAds.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[styles.button, (busy || loading || !product) && styles.buttonDisabled]}
        onPress={buy}
        disabled={busy || loading || !product}
      >
        {busy || loading ? (
          <ActivityIndicator color="#121212" />
        ) : (
          <Text style={styles.buttonText}>
            {product ? t('removeAds.buyWithPrice', { price: product.displayPrice }) : t('removeAds.buy')}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={restore} disabled={busy}>
        <Text style={styles.restoreText}>{t('removeAds.restore')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  errorBox: {
    backgroundColor: '#2C1A1A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#FF8A80',
    marginBottom: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9800',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  restoreText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 4,
  },
  ownedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  ownedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
});
