import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import * as authController from '../../controllers/authController';
import { colors, spacing } from '../../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  async function entrar() {
    if (loading) return;
    setErro('');
    setLoading(true);
    try { await authController.entrar(email, senha); }
    catch (error) { setErro(error.message); }
    finally { setLoading(false); }
  }
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <Text accessibilityRole="header" style={styles.title}>Bem-vindo</Text>
            <Text style={styles.description}>Entre para cuidar do seu veículo.</Text>
            <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="seu@email.com" />
            <Input label="Senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="Sua senha" />
            {erro ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text> : null}
            {loading ? <Loading message="Entrando…" /> : null}
            <Button title="Entrar" onPress={entrar} loading={loading} />
            <Button title="Criar conta" variant="outline" disabled={loading} onPress={() => navigation.navigate('Cadastro')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  form: { width: '100%', maxWidth: 480, gap: spacing.md },
  title: { color: colors.dark, fontSize: 28, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 16 },
  error: { color: colors.danger, fontSize: 14 },
});
