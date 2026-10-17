import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import * as authController from '../controllers/authController';
import { ROLES } from '../entities/Usuario';
import Loading from '../components/Loading';
import Button from '../components/Button';
import AuthStack from './AuthStack';
import ClientNavigator from './ClientNavigator';
import AdminNavigator from './AdminNavigator';
import { colors, spacing } from '../theme';

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg, card: colors.card, text: colors.text, border: colors.border, notification: colors.danger } };

export default function Navigation() {
  const { user, loading, error, tentarNovamente } = useAuth();
  const [saindo, setSaindo] = useState(false);
  const [erroSaida, setErroSaida] = useState('');
  async function sair() {
    setSaindo(true);
    setErroSaida('');
    try { await authController.sair(); }
    catch (erro) { setErroSaida(erro.message); }
    finally { setSaindo(false); }
  }
  if (loading) return <SafeAreaView style={styles.safe}><Loading message="Carregando sua sessão…" /></SafeAreaView>;
  if (error) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.errorContainer}>
        <Text accessibilityRole="alert" style={styles.error}>{error.message}</Text>
        {erroSaida ? <Text accessibilityRole="alert" style={styles.error}>{erroSaida}</Text> : null}
        <Button title="Tentar novamente" onPress={tentarNovamente} disabled={saindo} />
        <Button title="Voltar ao login" variant="outline" onPress={sair} loading={saindo} />
      </View>
    </SafeAreaView>
  );
  return (
    <NavigationContainer theme={theme}>
      {!user ? <AuthStack /> : user.role === ROLES.ADMIN ? <AdminNavigator key={user.uid} /> : <ClientNavigator key={user.uid} />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  errorContainer: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  error: { color: colors.danger, fontSize: 16, textAlign: 'center' },
});
