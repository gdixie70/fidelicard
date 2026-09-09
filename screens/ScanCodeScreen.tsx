import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { RootStackParamList } from '../App';
import { restoreLeadingZero } from '../utils/barcodeFormat';
import { t } from '../utils/i18n';

const FRAME_HEIGHT = 140;

const SCANNED_BARCODE_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'codabar',
  'itf14',
  'qr',
] as const;

export default function ScanCodeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scanLineY = useSharedValue(0);

  // Lo schermo resta montato nello stack quando si torna indietro da
  // "Aggiungi": senza questo reset, dopo la prima scansione riuscita
  // "scanned" restava true per sempre e la fotocamera smetteva di
  // rispondere a una nuova scansione.
  useEffect(() => {
    if (isFocused) setScanned(false);
  }, [isFocused]);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(FRAME_HEIGHT, { duration: 1400, easing: Easing.linear }),
      -1,
      true
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const handleScanned = ({ data, type }: BarcodeScanningResult) => {
    if (scanned || !data) return;
    setScanned(true);
    const isUpcOrEan13 = type === 'upc_a' || type === 'upc_e' || type === 'ean13';
    navigation.navigate('Aggiungi', { scannedCode: restoreLeadingZero(data, isUpcOrEan13) });
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permissionText}>
          {t('scan.permissionText')}
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t('scan.allowCamera')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...SCANNED_BARCODE_TYPES] }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame}>
          <Animated.View style={[styles.scanLine, scanLineStyle]} />
        </View>
        <Text style={styles.hint}>{t('scan.hint')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    color: '#121212',
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '80%',
    height: FRAME_HEIGHT,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FF9800',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FF9800',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  hint: {
    marginTop: 20,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
