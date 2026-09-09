import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../utils/i18n';

const SITE_URL = 'https://fidelicard.it/';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * QR di invito: inquadrandolo si apre il sito, che spiega l'app e porta
 * allo store. Non punta direttamente allo store perché su Android non
 * esiste ancora una scheda pubblica.
 */
export default function InviteQrModal({ visible, onClose }: Props) {
  const share = async () => {
    try {
      await Share.share({ message: t('inviteQr.shareMessage', { url: SITE_URL }) });
    } catch {
      // l'utente ha semplicemente annullato il foglio di condivisione
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('inviteQr.title')}</Text>
          <Text style={styles.subtitle}>{t('inviteQr.subtitle')}</Text>

          <View style={styles.qrBox}>
            <QRCode value={SITE_URL} size={190} backgroundColor="#fff" color="#121212" />
          </View>

          <Text style={styles.url}>{SITE_URL}</Text>

          <TouchableOpacity style={styles.shareButton} onPress={share}>
            <Ionicons name="share-outline" size={18} color="#121212" style={{ marginRight: 8 }} />
            <Text style={styles.shareText}>{t('inviteQr.shareButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>{t('inviteQr.close')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  url: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginTop: 22,
    width: '100%',
  },
  shareText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    marginTop: 14,
    paddingVertical: 6,
  },
  closeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
});
