import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as agendaController from '../../controllers/agendaController';
import { STATUS, STATUS_ROTULOS } from '../../entities/Agendamento';
import { formatarData, formatarPlaca } from '../../utils/formatters';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { colors, radii, spacing } from '../../theme';

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const chaveData = data => [data.getFullYear(), String(data.getMonth() + 1).padStart(2, '0'), String(data.getDate()).padStart(2, '0')].join('-');
function somarDias(texto, quantidade) {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia + quantidade, 12);
}
const estiloStatus = status => ({
  [STATUS.PENDENTE]: styles.pending,
  [STATUS.CONFIRMADO]: styles.confirmed,
  [STATUS.CANCELADO]: styles.canceled,
  [STATUS.CONCLUIDO]: styles.completed,
}[status] || styles.completed);

export default function AgendaAdminScreen({ navigation }) {
  const [hoje, setHoje] = useState(() => chaveData(new Date()));
  const [data, setData] = useState(() => chaveData(new Date()));
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');
  const requisicao = useRef(0);
  const emFoco = useRef(false);

  const carregar = useCallback(async (atualizar = false) => {
    const atual = ++requisicao.current;
    setErro('');
    setRefreshing(atualizar);
    setLoading(!atualizar);
    if (!atualizar) setAgendamentos([]);
    try {
      const dados = await agendaController.listarDoDia(data);
      if (emFoco.current && atual === requisicao.current) setAgendamentos(dados);
    } catch (error) {
      if (emFoco.current && atual === requisicao.current) setErro(error.message);
    } finally {
      if (emFoco.current && atual === requisicao.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [data]);

  useFocusEffect(useCallback(() => {
    emFoco.current = true;
    setHoje(chaveData(new Date()));
    carregar();
    return () => { emFoco.current = false; ++requisicao.current; };
  }, [carregar]));

  const pendentes = agendamentos.filter(item => item.status === STATUS.PENDENTE).length;
  const confirmados = agendamentos.filter(item => item.status === STATUS.CONFIRMADO).length;
  const dias = Array.from({ length: 7 }, (_, indice) => somarDias(hoje, indice));

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <FlatList
        data={loading ? [] : agendamentos}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => carregar(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.section}>
            <Text style={styles.eyebrow}>ORGANIZAÇÃO DO DIA</Text>
            <Text accessibilityRole="header" style={styles.title}>Agenda da estética</Text>
            <View style={styles.dateSelector}>
              <Pressable accessibilityRole="button" accessibilityLabel="Dia anterior" style={styles.arrow} onPress={() => setData(atual => chaveData(somarDias(atual, -1)))}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
              <Text accessibilityLiveRegion="polite" style={styles.dateTitle}>{diasSemana[somarDias(data, 0).getDay()]}, {formatarData(data)}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Próximo dia" style={styles.arrow} onPress={() => setData(atual => chaveData(somarDias(atual, 1)))}>
                <Ionicons name="chevron-forward" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
              {dias.map(dia => {
                const chave = chaveData(dia);
                const selecionado = chave === data;
                return (
                  <Pressable key={chave} accessibilityRole="button" accessibilityLabel={(chave === hoje ? 'Hoje, ' : '') + diasSemana[dia.getDay()] + ', ' + formatarData(chave)} accessibilityState={{ selected: selecionado }}
                    onPress={() => setData(chave)} style={[styles.day, chave === hoje && styles.today, selecionado && styles.selectedDay]}>
                    <Text style={[styles.dayLabel, selecionado && styles.selectedText]}>{chave === hoje ? 'Hoje' : diasSemana[dia.getDay()]}</Text>
                    <Text style={[styles.dayNumber, selecionado && styles.selectedText]}>{formatarData(chave).slice(0, 5)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.summary}>
              <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{loading ? '—' : pendentes}</Text><Text style={styles.secondary}>Pendentes</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{loading ? '—' : confirmados}</Text><Text style={styles.secondary}>Confirmados</Text></View>
            </View>
            {erro ? <View style={styles.feedback}>
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text>
              <Button title="Tentar novamente" variant="outline" onPress={() => carregar()} />
            </View> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading message="Carregando agenda…" /> : !erro ? <EmptyState title="Nenhum agendamento neste dia" description="Escolha outro dia para consultar a agenda." /> : null}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Card onPress={() => navigation.navigate('BookingDetail', { id: item.id, data: item.data })}>
              <View style={styles.cardHeader}>
                <Text style={styles.time}>{item.horaInicio} - {item.horaFim}</Text>
                <Text style={[styles.badge, estiloStatus(item.status)]}>{STATUS_ROTULOS[item.status] || 'Status não informado'}</Text>
              </View>
              <Text style={styles.service}>{item.servico?.nome || 'Serviço não encontrado'}</Text>
              <Text style={styles.client}>{item.cliente?.nome || 'Cliente não encontrado'}</Text>
              <Text style={styles.secondary}>{item.veiculo ? item.veiculo.marca + ' ' + item.veiculo.modelo + ' · ' + formatarPlaca(item.veiculo.placa) : 'Veículo não encontrado'}</Text>
              <Text style={styles.detailLink}>Ver detalhes</Text>
            </Card>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.md, gap: spacing.md },
  section: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.md },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 27, fontWeight: '800' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  arrow: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dateTitle: { flex: 1, flexShrink: 1, color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  days: { gap: spacing.sm },
  day: { minWidth: 66, minHeight: 64, padding: spacing.sm, gap: spacing.xs, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  today: { borderColor: colors.primary, borderWidth: 2 },
  selectedDay: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  dayNumber: { color: colors.text, fontSize: 15, fontWeight: '800' },
  selectedText: { color: colors.dark },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryItem: { flex: 1, minWidth: 110, padding: spacing.md, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: spacing.xs },
  summaryNumber: { color: colors.text, fontSize: 24, fontWeight: '800' },
  cardHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  time: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.pill, color: colors.white, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  pending: { backgroundColor: colors.primarySoft, color: colors.dark },
  confirmed: { backgroundColor: colors.success },
  canceled: { backgroundColor: colors.danger },
  completed: { backgroundColor: colors.muted },
  service: { color: colors.text, fontSize: 19, fontWeight: '700' },
  client: { color: colors.text, fontSize: 15, fontWeight: '600' },
  secondary: { color: colors.muted, fontSize: 14 },
  detailLink: { color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: spacing.xs },
  feedback: { gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
});
