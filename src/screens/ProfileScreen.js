import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import * as authController from '../controllers/authController';
import { ROLES } from '../entities/Usuario';
import Button from '../components/Button';
import Card from '../components/Card';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { colors, spacing } from '../theme';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  async function sair() {
    if (loading) return;
    setErro('');
    setLoading(true);
    try { await authController.sair(); }
    catch (error) { setErro(error.message); }
    finally { setLoading(false); }
  }
  if (!user) return <EmptyState title="Perfil indisponível" description="Entre novamente para ver seu perfil." />;
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <Card>
            <Text style={styles.label}>Nome</Text>
            <Text style={styles.value}>{user.nome}</Text>
            <Text style={styles.label}>E-mail</Text>
            <Text style={styles.value}>{user.email}</Text>
            <Text style={styles.label}>Perfil</Text>
            <Text style={styles.value}>{user.role === ROLES.ADMIN ? 'Administrador' : 'Cliente'}</Text>
          </Card>
          {erro ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text> : null}
          {loading ? <Loading message="Saindo…" /> : null}
          <Button title="Sair" variant="danger" onPress={sair} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, alignItems: 'center', padding: spacing.lg },
  form: { width: '100%', maxWidth: 600, gap: spacing.md },
  label: { color: colors.muted, fontSize: 14 },
  value: { color: colors.text, fontSize: 18, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14 },
});
