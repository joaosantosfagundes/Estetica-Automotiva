import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import * as authController from '../../controllers/authController';
import { formatarTelefone } from '../../utils/formatters';
import { colors, spacing } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  async function cadastrar() {
    if (loading) return;
    setErro('');
    setLoading(true);
    try { await authController.cadastrar({ nome, telefone, email, senha }); }
    catch (error) { setErro(error.message); }
    finally { setLoading(false); }
  }
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <Text accessibilityRole="header" style={styles.title}>Crie sua conta</Text>
            <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome completo" />
            <Input label="Telefone" value={telefone} onChangeText={texto => setTelefone(formatarTelefone(texto))} keyboardType="phone-pad" placeholder="(11) 99999-9999" />
            <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="seu@email.com" />
            <Input label="Senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="Pelo menos 6 caracteres" />
            {erro ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text> : null}
            {loading ? <Loading message="Criando sua conta…" /> : null}
            <Button title="Cadastrar" onPress={cadastrar} loading={loading} />
            <Button title="Já tenho conta" variant="outline" disabled={loading} onPress={() => navigation.goBack()} />
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
  error: { color: colors.danger, fontSize: 14 },
});
