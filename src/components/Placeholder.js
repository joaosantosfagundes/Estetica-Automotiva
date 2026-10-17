import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme';

export function makePlaceholder(titulo) {
  function Placeholder() {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>{titulo}</Text>
          <Text style={styles.description}>Em construção</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
  Placeholder.displayName = 'Placeholder(' + titulo + ')';
  return Placeholder;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.md, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.dark, fontSize: 28, fontWeight: '700', textAlign: 'center' },
  description: { color: colors.muted, fontSize: 16, textAlign: 'center' },
});
