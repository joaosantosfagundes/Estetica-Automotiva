import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export default function EmptyState({ title, description }) {
  return (
    <View style={styles.container}>
      <Text accessible={false} style={styles.icon}>∅</Text>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  icon: { color: colors.primary, fontSize: 40 },
  title: { color: colors.text, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  description: { color: colors.muted, fontSize: 16, textAlign: 'center' },
});
