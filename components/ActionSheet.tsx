import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ActionSheetItem = {
  key: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title?: string;
  items: ActionSheetItem[];
  onClose: () => void;
};

/**
 * Menu a comparsa dal basso, riusato sia per le azioni su una carta
 * (copia/modifica/presta/elimina) sia per la scelta della durata del
 * prestito - stessa interazione, elenco di righe diverso.
 */
export default function ActionSheet({ visible, title, items, onClose }: Props) {
  const handlePress = (item: ActionSheetItem) => {
    onClose();
    // Lascia chiudere del tutto la modale prima di eseguire l'azione, altrimenti
    // su iOS presentare subito un altro pop-up/selettore nativo sopra a uno che
    // si sta ancora chiudendo fallisce in silenzio (nessun errore, nessun effetto).
    setTimeout(item.onPress, 400);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetWrapper} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            {title && (
              <View style={styles.titleRow}>
                <Text style={styles.title}>{title}</Text>
              </View>
            )}
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.row}
                onPress={() => handlePress(item)}
              >
                {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
                <Text style={[styles.label, item.destructive && styles.destructiveLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelRow} onPress={onClose}>
              <Text style={styles.cancelLabel}>Annulla</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  titleRow: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    marginBottom: 4,
  },
  title: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 14,
    width: 26,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  destructiveLabel: {
    color: '#FF5252',
  },
  cancelRow: {
    marginTop: 6,
    marginBottom: 6,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
  },
  cancelLabel: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '700',
  },
});
