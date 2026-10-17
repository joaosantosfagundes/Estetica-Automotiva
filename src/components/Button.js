import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme';

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }) {
  const bloqueado = disabled || loading;
  const tipo = ['primary', 'outline', 'danger'].includes(variant) ? variant : 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: bloqueado, busy: loading }}
      disabled={bloqueado}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[tipo], bloqueado && styles.disabled, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={tipo === 'outline' ? colors.primary : colors.card} /> : null}
      <Text style={[styles.title, tipo === 'outline' && styles.outlineTitle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, width: '100%', padding: spacing.md, borderRadius: 12, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  outline: { backgroundColor: colors.card, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  title: { color: colors.card, fontSize: 16, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  outlineTitle: { color: colors.primary },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
