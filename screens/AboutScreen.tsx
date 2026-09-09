import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AdBanner from '../components/AdBanner';
import { exportCards, importCards } from '../utils/cardBackup';
import { isNativeIapAvailable } from '../utils/iap';
import RemoveAdsButton from '../components/RemoveAdsButton';
import googleMobileAds, { isNativeAdsAvailable } from '../utils/ads';
import { t } from '../utils/i18n';

type Step = { icon: string; title: string; text: string };
type Point = { icon: string; title: string; text: string };

const STEPS: Step[] = [
  { icon: 'add-circle-outline', title: t('about.step1Title'), text: t('about.step1Text') },
  { icon: 'images-outline', title: t('about.step2Title'), text: t('about.step2Text') },
  { icon: 'barcode-outline', title: t('about.step3Title'), text: t('about.step3Text') },
  { icon: 'people-outline', title: t('about.step4Title'), text: t('about.step4Text') },
];

const MANIFESTO: Point[] = [
  { icon: 'lock-closed-outline', title: t('about.point1Title'), text: t('about.point1Text') },
  { icon: 'apps-outline', title: t('about.point2Title'), text: t('about.point2Text') },
  { icon: 'cloud-offline-outline', title: t('about.point3Title'), text: t('about.point3Text') },
  { icon: 'flash-outline', title: t('about.point4Title'), text: t('about.point4Text') },
  { icon: 'card-outline', title: t('about.point5Title'), text: t('about.point5Text') },
  { icon: 'sync-outline', title: t('about.point6Title'), text: t('about.point6Text') },
];

export default function AboutScreen() {
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const handleExport = async () => {
    if (busy) return;
    setBusy('export');
    try {
      const result = await exportCards();
      if (!result) {
        Alert.alert(t('about.exportEmptyTitle'), t('about.exportEmptyBody'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('about.exportErrorBody'));
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    if (busy) return;
    setBusy('import');
    try {
      const result = await importCards();
      if (!result) return; // annullato dall'utente
      Alert.alert(
        t('about.importedTitle'),
        t('about.importedAdded', { count: result.added }) +
          (result.skipped > 0 ? t('about.importedSkipped', { count: result.skipped }) : '')
      );
    } catch (err) {
      Alert.alert(t('common.error'), t('about.importErrorBody'));
    } finally {
      setBusy(null);
    }
  };

  const handleManageConsent = async () => {
    if (!isNativeAdsAvailable || !googleMobileAds) return;
    try {
      await googleMobileAds.AdsConsent.showPrivacyOptionsForm();
    } catch {
      // Il form non è disponibile (es. fuori dallo Spazio Economico
      // Europeo, dove il consenso non serve): niente da fare.
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.container}>
        <Text style={styles.heroTitle}>{t('about.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>
          {t('about.heroSubtitle')}
        </Text>

        <Text style={styles.sectionTitle}>{t('about.sectionHow')}</Text>
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

        <Text style={styles.sectionTitle}>{t('about.sectionWhy')}</Text>
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

        <Text style={styles.sectionTitle}>{t('about.sectionBackup')}</Text>
        <Text style={styles.backupIntro}>
          {t('about.backupIntro')}
        </Text>
        <TouchableOpacity style={styles.backupButton} onPress={handleExport} disabled={!!busy}>
          <Ionicons name="download-outline" size={18} color="#FF9800" style={styles.backupButtonIcon} />
          <Text style={styles.backupButtonText}>
            {busy === 'export' ? t('about.exportingButton') : t('about.exportButton')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backupButton} onPress={handleImport} disabled={!!busy}>
          <Ionicons name="cloud-upload-outline" size={18} color="#FF9800" style={styles.backupButtonIcon} />
          <Text style={styles.backupButtonText}>
            {busy === 'import' ? t('about.importingButton') : t('about.importButton')}
          </Text>
        </TouchableOpacity>

        {isNativeAdsAvailable && (
          <>
            <Text style={styles.sectionTitle}>{t('removeAds.sectionTitle')}</Text>
            <Text style={styles.backupIntro}>{t('removeAds.intro')}</Text>
            {isNativeIapAvailable && <RemoveAdsButton />}
            <TouchableOpacity onPress={handleManageConsent}>
              <Text style={styles.restoreText}>{t('removeAds.manageConsent')}</Text>
            </TouchableOpacity>
          </>
        )}
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
  backupIntro: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
    marginBottom: 14,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backupButtonIcon: {
    marginRight: 10,
  },
  backupButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  restoreText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 8,
  },
});
