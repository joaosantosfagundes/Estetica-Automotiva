import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as agendaController from '../../controllers/agendaController';
import { STATUS, STATUS_ROTULOS } from '../../entities/Agendamento';
import { formatarData, formatarMoeda, formatarPlaca, formatarTelefone } from '../../utils/formatters';
import AppError from '../../utils/AppError';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { colors, radii, spacing } from '../../theme';

const acoesPorStatus = {
  [STATUS.PENDENTE]: [
    { titulo: 'Confirmar', status: STATUS.CONFIRMADO, pergunta: 'Confirmar este agendamento?' },
    { titulo: 'Recusar', status: STATUS.CANCELADO, pergunta: 'Recusar este agendamento?', perigo: true },
  ],
  [STATUS.CONFIRMADO]: [
    { titulo: 'Concluir', status: STATUS.CONCLUIDO, pergunta: 'Marcar este agendamento como concluído?' },
    { titulo: 'Cancelar', status: STATUS.CANCELADO, pergunta: 'Cancelar este agendamento?', perigo: true },
  ],
};

function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60), restante = minutos % 60;
  return horas ? horas + ' h' + (restante ? ' ' + restante + ' min' : '') : minutos + ' min';
}

export default function AgendamentoDetalheScreen({ route, navigation }) {
  const id = route?.params?.id;
  const data = route?.params?.data;
  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [executando, setExecutando] = useState(null);
  const [valorRecebido, setValorRecebido] = useState(null);
  const [erroValor, setErroValor] = useState('');
  const requisicao = useRef(0);
  const emFoco = useRef(false);
  const montado = useRef(true);
  const alterando = useRef(false);
  const confirmando = useRef(false);

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  const carregar = useCallback(async () => {
    const atual = ++requisicao.current;
    setLoading(true); setErro(''); setErroAcao(''); setAgendamento(null);
    setValorRecebido(null); setErroValor('');
    try {
      if (typeof id !== 'string' || !id.trim()) throw new AppError('O agendamento informado é inválido.', 'agendamento/id-invalido');
      const lista = await agendaController.listarDoDia(data);
      if (emFoco.current && atual === requisicao.current) setAgendamento(lista.find(item => item.id === id) ?? null);
    } catch (error) {
      if (emFoco.current && atual === requisicao.current) setErro(error.message);
    } finally {
      if (emFoco.current && atual === requisicao.current) setLoading(false);
    }
  }, [id, data]);

  useFocusEffect(useCallback(() => {
    emFoco.current = true;
    carregar();
    return () => { emFoco.current = false; confirmando.current = false; ++requisicao.current; };
  }, [carregar]));

  async function alterar(status, valor) {
    if (!emFoco.current || alterando.current) return;
    alterando.current = true;
    setExecutando(status); setErroAcao(''); setErroValor('');
    try {
      await agendaController.alterarStatus(id, status, valor);
      if (emFoco.current) navigation.goBack();
    } catch (error) {
      if (emFoco.current) {
        if (error.campos?.valorRecebido) setErroValor(error.campos.valorRecebido);
        else setErroAcao(error.message);
      }
    } finally {
      alterando.current = false;
      if (montado.current) setExecutando(null);
    }
  }

  function confirmar(acao) {
    if (alterando.current || confirmando.current) return;
    if (acao.status === STATUS.CONCLUIDO) {
      const preco = agendamento.servico?.preco;
      setValorRecebido(Number.isFinite(preco) ? preco.toFixed(2).replace('.', ',') : '');
      setErroAcao(''); setErroValor('');
      return;
    }
    confirmando.current = true;
    Alert.alert(acao.pergunta, 'O status será atualizado na agenda da estética e na conta do cliente.', [
      { text: 'Voltar', style: 'cancel', onPress: () => { confirmando.current = false; } },
      { text: acao.titulo, style: acao.perigo ? 'destructive' : 'default', onPress: () => { confirmando.current = false; alterar(acao.status); } },
    ], { cancelable: true, onDismiss: () => { confirmando.current = false; } });
  }

  if (loading) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><Loading message="Carregando agendamento…" /></SafeAreaView>;
  if (erro) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><View style={styles.feedback}>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text>
    <Button title="Tentar novamente" onPress={carregar} />
  </View></SafeAreaView>;
  if (!agendamento) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><View style={styles.feedback}>
    <EmptyState title="Agendamento não encontrado" description="Ele pode ter sido alterado. Volte e atualize a agenda." />
    <Button title="Voltar para a agenda" variant="outline" onPress={() => navigation.goBack()} />
  </View></SafeAreaView>;

  const { servico, cliente, veiculo, status } = agendamento;
  const estiloStatus = { [STATUS.PENDENTE]: styles.pending, [STATUS.CONFIRMADO]: styles.confirmed, [STATUS.CANCELADO]: styles.canceled, [STATUS.CONCLUIDO]: styles.completed }[status] || styles.completed;
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.title}>{servico?.nome || 'Serviço não encontrado'}</Text>
          <Text style={[styles.badge, estiloStatus]}>{STATUS_ROTULOS[status] || 'Status não informado'}</Text>
          <Card>
            <Text style={styles.label}>DATA E HORÁRIO</Text>
            <Text style={styles.mainText}>{formatarData(agendamento.data)}</Text>
            <Text style={styles.body}>{agendamento.horaInicio} - {agendamento.horaFim}</Text>
          </Card>
          <Card>
            <Text style={styles.label}>SERVIÇO</Text>
            {servico ? <>
              <Text style={styles.mainText}>{servico.nome}</Text>
              <Text style={styles.price}>{formatarMoeda(servico.preco)}</Text>
              <Text style={styles.body}>Duração: {formatarDuracao(servico.duracaoMin)}</Text>
            </> : <Text style={styles.secondary}>Serviço não encontrado.</Text>}
          </Card>
          <Card>
            <Text style={styles.label}>CLIENTE</Text>
            {cliente ? <>
              <Text style={styles.mainText}>{cliente.nome || 'Nome não informado'}</Text>
              <Text style={styles.body}>{cliente.telefone ? formatarTelefone(cliente.telefone) : 'Telefone não informado'}</Text>
            </> : <Text style={styles.secondary}>Cliente não encontrado.</Text>}
          </Card>
          <Card>
            <Text style={styles.label}>VEÍCULO</Text>
            {veiculo ? <>
              <Text style={styles.mainText}>{veiculo.marca} {veiculo.modelo}</Text>
              <Text style={styles.body}>{formatarPlaca(veiculo.placa)}</Text>
            </> : <Text style={styles.secondary}>Veículo não encontrado.</Text>}
          </Card>
          {erroAcao ? <View style={styles.actions}>
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erroAcao}</Text>
            <Button title="Atualizar agendamento" variant="outline" disabled={Boolean(executando)} onPress={carregar} />
          </View> : null}
          {status === STATUS.CONFIRMADO && valorRecebido !== null ? <Card>
            <Text accessibilityRole="header" style={styles.mainText}>Concluir atendimento</Text>
            <Text style={styles.secondary}>Confirme quanto recebeu pelo serviço para registrar a entrada.</Text>
            <View pointerEvents={executando ? 'none' : 'auto'}>
              <Input label="Valor recebido (R$)" value={valorRecebido} keyboardType="decimal-pad" placeholder="0,00"
                onChangeText={texto => { setValorRecebido(texto); setErroValor(''); }} error={erroValor} />
            </View>
            <Button title="Concluir e registrar" loading={executando === STATUS.CONCLUIDO} disabled={Boolean(executando)}
              onPress={() => alterar(STATUS.CONCLUIDO, valorRecebido)} />
            <Button title="Voltar" variant="outline" disabled={Boolean(executando)}
              onPress={() => { setValorRecebido(null); setErroValor(''); setErroAcao(''); }} />
          </Card> : <View style={styles.actions}>
            {(acoesPorStatus[status] || []).map(acao => <Button key={acao.titulo} title={acao.titulo} variant={acao.perigo ? 'danger' : 'primary'}
              loading={executando === acao.status} disabled={Boolean(executando)} onPress={() => confirmar(acao)} />)}
          </View>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.md },
  section: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: 27, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, color: colors.white, fontSize: 14, fontWeight: '700' },
  pending: { backgroundColor: colors.primarySoft, color: colors.dark },
  confirmed: { backgroundColor: colors.success },
  canceled: { backgroundColor: colors.danger },
  completed: { backgroundColor: colors.muted },
  label: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  mainText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.text, fontSize: 16 },
  secondary: { color: colors.muted, fontSize: 15 },
  price: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  actions: { gap: spacing.sm },
  feedback: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.md, justifyContent: 'center', gap: spacing.md },
  error: { color: colors.danger, fontSize: 14 },
});
