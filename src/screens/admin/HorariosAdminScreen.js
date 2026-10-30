import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as configuracaoController from '../../controllers/configuracaoController';
import { formatarHora } from '../../utils/formatters';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import { colors, spacing } from '../../theme';

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function HorariosAdminScreen() {
  const [formulario, setFormulario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroCarga, setErroCarga] = useState('');
  const [erro, setErro] = useState('');
  const [campos, setCampos] = useState({});
  const [sucesso, setSucesso] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const montado = useRef(true);
  const emFoco = useRef(false);
  const bloqueio = useRef(false);
  const versao = useRef(0);

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    emFoco.current = true;
    const atual = ++versao.current;
    setCarregando(true);
    setErroCarga('');
    setErro('');
    setCampos({});
    setSucesso('');
    configuracaoController.obter().then(dados => {
      if (emFoco.current && atual === versao.current) setFormulario(dados);
    }).catch(error => {
      if (emFoco.current && atual === versao.current) setErroCarga(error.message);
    }).finally(() => {
      if (emFoco.current && atual === versao.current) setCarregando(false);
    });
    return () => { emFoco.current = false; ++versao.current; };
  }, [tentativa]));

  function alterarCampo(campo, valor) {
    setFormulario(atual => ({ ...atual, [campo]: valor }));
    setCampos(atuais => ({ ...atuais, [campo]: undefined }));
    setErro('');
    setSucesso('');
  }

  function alternarDia(dia) {
    const selecionados = formulario.diasFuncionamento;
    alterarCampo('diasFuncionamento', selecionados.includes(dia) ? selecionados.filter(valor => valor !== dia) : [...selecionados, dia].sort((a, b) => a - b));
  }

  async function salvar() {
    if (bloqueio.current) return;
    bloqueio.current = true;
    const atual = versao.current;
    setSalvando(true);
    setErro('');
    setCampos({});
    setSucesso('');
    try {
      const dados = await configuracaoController.salvar(formulario);
      if (emFoco.current && atual === versao.current) {
        setFormulario(dados);
        setSucesso('Horário de funcionamento salvo.');
      }
    } catch (error) {
      if (emFoco.current && atual === versao.current) {
        if (error.campos) setCampos(error.campos);
        else setErro(error.message);
      }
    } finally {
      bloqueio.current = false;
      if (montado.current) setSalvando(false);
    }
  }

  if (carregando) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><Loading message="Carregando horário de funcionamento…" /></SafeAreaView>;
  if (erroCarga) return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <View style={styles.feedback}>
        <Text accessibilityRole="alert" style={styles.error}>{erroCarga}</Text>
        <Button title="Tentar novamente" onPress={() => setTentativa(valor => valor + 1)} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <View pointerEvents={salvando ? 'none' : 'auto'} style={styles.fields}>
              <Input label="Abertura" value={formulario.abertura} onChangeText={texto => alterarCampo('abertura', formatarHora(texto))} error={campos.abertura} keyboardType="number-pad" placeholder="08:00" />
              <Input label="Fechamento" value={formulario.fechamento} onChangeText={texto => alterarCampo('fechamento', formatarHora(texto))} error={campos.fechamento} keyboardType="number-pad" placeholder="18:00" />
              <Text style={styles.label}>Dias de funcionamento</Text>
              <View style={styles.days}>
                {diasSemana.map((dia, indice) => {
                  const selecionado = formulario.diasFuncionamento.includes(indice);
                  return (
                    <Pressable key={dia} accessibilityRole="checkbox" accessibilityLabel={dia} accessibilityState={{ checked: selecionado, disabled: salvando }} disabled={salvando} onPress={() => alternarDia(indice)} style={[styles.day, selecionado && styles.selectedDay]}>
                      <Text style={[styles.dayText, selecionado && styles.selectedDayText]}>{dia}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {campos.diasFuncionamento ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{campos.diasFuncionamento}</Text> : null}
            </View>
            {erro ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text> : null}
            {sucesso ? <Text accessibilityLiveRegion="polite" style={styles.success}>{sucesso}</Text> : null}
            <Button title="Salvar" onPress={salvar} loading={salvando} />
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
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: { minWidth: 56, minHeight: 48, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  selectedDay: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  selectedDayText: { color: colors.dark },
  error: { color: colors.danger, fontSize: 14 },
  success: { color: colors.success, fontSize: 14 },
  feedback: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
});
