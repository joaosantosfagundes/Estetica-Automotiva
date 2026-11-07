import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import * as agendamentoController from '../../controllers/agendamentoController';
import { STATUS, STATUS_ATIVOS, STATUS_ROTULOS } from '../../entities/Agendamento';
import { formatarDataPorExtenso, formatarMoeda, formatarPlaca } from '../../utils/formatters';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { colors, radii, spacing } from '../../theme';

export default function AgendaScreen({ navigation }) {
  const { user } = useAuth();
  const [aba, setAba] = useState('proximos');
  const [listas, setListas] = useState({ proximos: [], historico: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');
  const [cancelando, setCancelando] = useState(null);
  const requisicao = useRef(0), emFoco = useRef(false), montado = useRef(true);
  const bloqueio = useRef(false), confirmando = useRef(false), usuarioAtual = useRef(user?.uid);
  usuarioAtual.current = user?.uid;
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  const carregar = useCallback(async (atualizar = false) => {
    const atual = ++requisicao.current;
    setErro(''); setRefreshing(atualizar); setLoading(!atualizar);
    if (!atualizar) setListas({ proximos: [], historico: [] });
    try {
      const dados = await agendamentoController.meusAgendamentos(user?.uid);
      if (emFoco.current && atual === requisicao.current) setListas(dados);
    } catch (error) { if (emFoco.current && atual === requisicao.current) setErro(error.message); }
    finally { if (emFoco.current && atual === requisicao.current) { setLoading(false); setRefreshing(false); } }
  }, [user?.uid]);
  useFocusEffect(useCallback(() => {
    emFoco.current = true; carregar();
    return () => { emFoco.current = false; confirmando.current = false; ++requisicao.current; };
  }, [carregar]));

  async function cancelar(item) {
    if (bloqueio.current || !emFoco.current) return;
    bloqueio.current = true;
    const uid = user?.uid;
    ++requisicao.current; setRefreshing(false); setCancelando(item.id); setErro('');
    try {
      await agendamentoController.cancelar(uid, item.id);
      if (montado.current && usuarioAtual.current === uid) {
        // Mantém o cancelamento visível mesmo se a consulta seguinte falhar.
        setListas(atuais => ({
          proximos: atuais.proximos.filter(atual => atual.id !== item.id),
          historico: [{ ...item, status: STATUS.CANCELADO }, ...atuais.historico.filter(atual => atual.id !== item.id)]
            .sort((a, b) => (b.data + b.horaInicio).localeCompare(a.data + a.horaInicio)),
        }));
        if (emFoco.current) await carregar(true);
      }
    } catch (error) { if (emFoco.current && usuarioAtual.current === uid) setErro(error.message); }
    finally { bloqueio.current = false; if (montado.current && usuarioAtual.current === uid) setCancelando(null); }
  }
  function confirmarCancelamento(item) {
    if (bloqueio.current || confirmando.current) return;
    confirmando.current = true;
    Alert.alert('Cancelar agendamento?', 'Deseja cancelar ' + (item.servico?.nome || 'este serviço') + ' em ' + formatarDataPorExtenso(item.data) + ', às ' + item.horaInicio + '?', [
      { text: 'Voltar', style: 'cancel', onPress: () => { confirmando.current = false; } },
      { text: 'Cancelar agendamento', style: 'destructive', onPress: () => { confirmando.current = false; cancelar(item); } },
    ], { cancelable: true, onDismiss: () => { confirmando.current = false; } });
  }

  const itens = listas[aba];
  return <SafeAreaView edges={['bottom']} style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { if (!bloqueio.current) carregar(true); }} tintColor={colors.primary} colors={[colors.primary]} />}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>SEU TEMPO</Text><Text accessibilityRole="header" style={styles.title}>Agenda</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Agendar um serviço" style={styles.calendarButton} onPress={() => navigation.navigate('Serviços')}><Ionicons name="calendar-outline" size={20} color={colors.text} /></Pressable>
      </View>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {[{ chave: 'proximos', titulo: 'Próximos' }, { chave: 'historico', titulo: 'Histórico' }].map(item => <Pressable key={item.chave} accessibilityRole="tab" accessibilityState={{ selected: aba === item.chave }} onPress={() => setAba(item.chave)} style={[styles.tab, aba === item.chave && styles.selectedTab]}>
          <Text style={[styles.tabText, aba === item.chave && styles.selectedTabText]}>{item.titulo}</Text>
        </Pressable>)}
      </View>
      {loading ? <Loading message="Carregando agendamentos…" /> : <>
        {erro ? <View style={styles.feedback}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text><Button title="Atualizar agenda" variant="outline" disabled={Boolean(cancelando)} onPress={() => carregar(true)} /></View> : null}
        {!erro && itens.length === 0 ? <View style={styles.feedback}>
          <EmptyState title={aba === 'proximos' ? 'Nenhum próximo agendamento' : 'Seu histórico está vazio'} description={aba === 'proximos' ? 'Escolha um serviço e reserve seu próximo cuidado.' : 'Seus agendamentos anteriores e cancelados aparecerão aqui.'} />
          <Button title="Ver serviços" variant="outline" onPress={() => navigation.navigate('Serviços')} />
        </View> : null}
        {itens.map((item, indice) => {
          const proximo = aba === 'proximos';
          const fundoStatus = { [STATUS.PENDENTE]: styles.pending, [STATUS.CONFIRMADO]: styles.confirmed, [STATUS.CANCELADO]: styles.canceled, [STATUS.CONCLUIDO]: styles.completed }[item.status];
          return <View key={item.id} style={[styles.nextCard, !proximo && styles.historyCard]}>
            <View style={styles.nextHeader}><Text style={styles.nextLabel}>{proximo ? indice === 0 ? 'PRÓXIMO AGENDAMENTO' : 'AGENDAMENTO' : 'HISTÓRICO'}</Text><Text style={[styles.status, fundoStatus]}>{STATUS_ROTULOS[item.status] || 'Status não informado'}</Text></View>
            <Text style={[styles.service, !proximo && styles.historyText]}>{item.servico?.nome || 'Serviço não encontrado'}</Text>
            <Text style={[styles.vehicle, !proximo && styles.historyMuted]}>{item.veiculo ? item.veiculo.marca + ' ' + item.veiculo.modelo + ' · ' + formatarPlaca(item.veiculo.placa) : 'Veículo não encontrado'}</Text>
            <Text style={[styles.price, !proximo && styles.historyText]}>{item.servico ? formatarMoeda(item.servico.preco) : 'Preço não disponível'}</Text>
            <View style={[styles.divider, !proximo && styles.historyDivider]} />
            <View style={styles.dateRow}>
              <View style={styles.dateItem}><Ionicons name="calendar-clear-outline" size={17} color={colors.primary} /><Text style={[styles.dateText, !proximo && styles.historyText]}>{formatarDataPorExtenso(item.data)}</Text></View>
              <View style={styles.dateItem}><Ionicons name="time-outline" size={17} color={colors.primary} /><Text style={[styles.dateText, !proximo && styles.historyText]}>{item.horaInicio} - {item.horaFim}</Text></View>
            </View>
            {proximo && STATUS_ATIVOS.includes(item.status) ? <View style={styles.cancelAction}><Button title="Cancelar agendamento" variant="danger" loading={cancelando === item.id} disabled={Boolean(cancelando)} onPress={() => confirmarCancelamento(item)} /></View> : null}
          </View>;
        })}
      </>}
      <Pressable accessibilityRole="button" style={styles.newButton} onPress={() => navigation.navigate('Serviços')}><Ionicons name="add" size={19} color={colors.dark} /><Text style={styles.newButtonText}>Novo agendamento</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, width: '100%', maxWidth: 768, alignSelf: 'center', padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 3 },
  calendarButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, padding: spacing.xs },
  tab: { flex: 1, minHeight: 44, padding: spacing.sm, borderRadius: radii.pill, justifyContent: 'center', alignItems: 'center' },
  selectedTab: { backgroundColor: colors.primary },
  tabText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  selectedTabText: { color: colors.dark },
  nextCard: { backgroundColor: colors.dark, borderRadius: radii.lg, padding: spacing.lg, gap: 7 },
  nextHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  nextLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  status: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: radii.pill, color: colors.white, fontSize: 11, fontWeight: '700', flexShrink: 1 },
  pending: { backgroundColor: colors.primarySoft, color: colors.dark },
  confirmed: { backgroundColor: colors.statusConfirmedBackground, color: colors.statusConfirmedText },
  canceled: { backgroundColor: colors.danger },
  completed: { backgroundColor: colors.successSoft, color: colors.success },
  service: { color: colors.white, fontSize: 23, fontWeight: '800', marginTop: 13 },
  vehicle: { color: colors.textOnDarkMuted, fontSize: 13 },
  price: { color: colors.white, fontSize: 17, fontWeight: '700', marginTop: spacing.xs },
  divider: { height: 1, backgroundColor: colors.dividerOnDark, marginVertical: 11 },
  dateRow: { gap: spacing.sm },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dateText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '700' },
  historyCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  historyText: { color: colors.text },
  historyMuted: { color: colors.muted },
  historyDivider: { backgroundColor: colors.border },
  cancelAction: { marginTop: spacing.md },
  feedback: { gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
  newButton: { minHeight: 48, backgroundColor: colors.primary, borderRadius: radii.pill, padding: spacing.md, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 7 },
  newButtonText: { color: colors.dark, fontSize: 14, fontWeight: '800', flexShrink: 1 },
});
