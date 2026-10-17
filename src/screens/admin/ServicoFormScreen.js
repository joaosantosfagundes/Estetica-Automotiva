import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as servicoController from '../../controllers/servicoController';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { colors, spacing } from '../../theme';

const formularioVazio = { nome: '', descricao: '', preco: '', duracaoMin: '', ativo: true };

export default function ServicoFormScreen({ route, navigation }) {
  const id = route?.params?.id;
  const editando = id !== undefined;
  const [formulario, setFormulario] = useState(formularioVazio);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [erroCarga, setErroCarga] = useState('');
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState({});
  const [tentativa, setTentativa] = useState(0);
  const montado = useRef(true);
  const bloqueio = useRef(false);

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  useEffect(() => {
    let ativo = true;
    setFormulario(formularioVazio);
    setErroCarga('');
    setErro('');
    setErrosCampos({});
    if (!editando) { setCarregando(false); return () => { ativo = false; }; }
    setCarregando(true);
    servicoController.buscar(id).then(servico => {
      if (ativo) setFormulario({ nome: servico.nome, descricao: servico.descricao, preco: String(servico.preco).replace('.', ','), duracaoMin: String(servico.duracaoMin), ativo: servico.ativo });
    }).catch(error => {
      if (ativo) setErroCarga(error.message);
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, [id, editando, tentativa]);

  function alterarCampo(campo, valor) {
    setFormulario(atual => ({ ...atual, [campo]: valor }));
    setErrosCampos(atuais => ({ ...atuais, [campo]: undefined }));
    setErro('');
  }

  async function salvar() {
    if (bloqueio.current) return;
    bloqueio.current = true;
    setSalvando(true);
    setErro('');
    setErrosCampos({});
    try {
      await servicoController.salvar(formulario, id);
      if (montado.current) navigation.goBack();
    } catch (error) {
      if (!montado.current) return;
      const campoPorCodigo = { 'validacao/nome': 'nome', 'servico/nome-repetido': 'nome', 'validacao/preco': 'preco', 'validacao/duracaoMin': 'duracaoMin', 'validacao/descricao': 'descricao', 'validacao/ativo': 'ativo' };
      const campo = campoPorCodigo[error.code];
      if (error.campos) setErrosCampos(error.campos);
      else if (campo) setErrosCampos({ [campo]: error.message });
      else setErro(error.message);
    } finally {
      bloqueio.current = false;
      if (montado.current) setSalvando(false);
    }
  }

  if (carregando) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><Loading message="Carregando serviço…" /></SafeAreaView>;
  if (erroCarga) return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <View style={styles.feedback}>
        <EmptyState title="Não foi possível carregar o serviço" />
        <Text accessibilityRole="alert" style={styles.error}>{erroCarga}</Text>
        <Button title="Tentar novamente" onPress={() => setTentativa(valor => valor + 1)} />
        <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <View pointerEvents={salvando ? 'none' : 'auto'} style={styles.fields}>
              <Input label="Nome" value={formulario.nome} onChangeText={valor => alterarCampo('nome', valor)} error={errosCampos.nome} placeholder="Ex.: Lavagem simples" />
              <Input label="Descrição" value={formulario.descricao} onChangeText={valor => alterarCampo('descricao', valor)} error={errosCampos.descricao} placeholder="Descreva o serviço (opcional)" />
              <Input label="Preço (R$)" value={formulario.preco} onChangeText={valor => alterarCampo('preco', valor)} error={errosCampos.preco} keyboardType="decimal-pad" placeholder="Ex.: 40,00" />
              <Input label="Duração em minutos" value={formulario.duracaoMin} onChangeText={valor => alterarCampo('duracaoMin', valor)} error={errosCampos.duracaoMin} keyboardType="number-pad" placeholder="Entre 15 e 600" />
              <View style={styles.switchRow}>
                <Text style={styles.label}>Serviço ativo</Text>
                <Switch accessibilityLabel="Serviço ativo" value={formulario.ativo} onValueChange={valor => alterarCampo('ativo', valor)} disabled={salvando} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.card} ios_backgroundColor={colors.border} />
              </View>
              {errosCampos.ativo ? <Text accessibilityRole="alert" style={styles.error}>{errosCampos.ativo}</Text> : null}
            </View>
            {erro ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text> : null}
            <Button title={editando ? 'Salvar alterações' : 'Cadastrar serviço'} onPress={salvar} loading={salvando} />
            <Button title="Cancelar" variant="outline" disabled={salvando} onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.lg, alignItems: 'center' },
  form: { width: '100%', maxWidth: 600, gap: spacing.md },
  fields: { gap: spacing.md },
  switchRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  label: { color: colors.text, fontSize: 16, flexShrink: 1 },
  error: { color: colors.danger, fontSize: 14 },
  feedback: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
});
