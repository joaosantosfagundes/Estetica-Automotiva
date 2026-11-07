import React, { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Input from './Input';
import Button from './Button';
import EmptyState from './EmptyState';
import { colors, radii, spacing } from '../theme';

// options: [{ value, label }]; value é o código; onSelect recebe a opção completa.
export default function Select({ label, value, options = [], onSelect, error, placeholder = 'Selecione', loading = false, searchable = true }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const selecionado = options.find(item => String(item.value) === String(value));
  const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const filtradas = searchable ? options.filter(item => normalizar(item.label).includes(normalizar(busca))) : options;
  function fechar() { setAberto(false); setBusca(''); }
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={label || placeholder} accessibilityState={{ disabled: loading, expanded: aberto }} disabled={loading} onPress={() => setAberto(true)} style={[styles.input, Boolean(error) && styles.invalid]}>
        <Text style={[styles.value, !selecionado && styles.placeholder]}>{selecionado?.label || placeholder}</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="chevron-down" size={18} color={colors.muted} />}
      </Pressable>
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <Modal visible={aberto} transparent animationType="slide" onRequestClose={fechar}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modal}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar seleção" style={styles.backdrop} onPress={fechar} />
          <SafeAreaView edges={['bottom']} accessibilityViewIsModal style={styles.panel}>
            <Text accessibilityRole="header" style={styles.title}>{label || 'Selecione uma opção'}</Text>
            {searchable ? <Input label="Buscar" value={busca} onChangeText={setBusca} placeholder="Digite para buscar" /> : null}
            <FlatList data={filtradas} keyExtractor={item => String(item.value)} keyboardShouldPersistTaps="handled" style={styles.options}
              ListEmptyComponent={<EmptyState title="Nenhuma opção encontrada" description="Tente outra busca ou carregue as opções novamente." />}
              renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: String(value) === String(item.value) }} onPress={() => { onSelect(item); fechar(); }} style={styles.option}><Text style={styles.optionText}>{item.label}</Text></Pressable>} />
            <Button title="Fechar" variant="outline" onPress={fechar} />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%', gap: spacing.sm }, label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { flex: 1, color: colors.text, fontSize: 16 }, placeholder: { color: colors.muted }, invalid: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 14 },
  modal: { flex: 1, justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.dark, opacity: 0.45 },
  panel: { width: '100%', maxWidth: 720, alignSelf: 'center', maxHeight: '85%', padding: spacing.md, gap: spacing.md, backgroundColor: colors.card, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' }, options: { flexGrow: 0, flexShrink: 1 },
  option: { minHeight: 48, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }, optionText: { color: colors.text, fontSize: 16 },
});
