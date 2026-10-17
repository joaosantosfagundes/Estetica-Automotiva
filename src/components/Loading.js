import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export default function Loading({ message }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={message || 'Carregando'} accessibilityState={{ busy: true }} style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  message: { color: colors.muted, fontSize: 16, textAlign: 'center' },
});
