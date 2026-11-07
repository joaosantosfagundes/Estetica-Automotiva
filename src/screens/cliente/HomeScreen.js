import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as servicoController from '../../controllers/servicoController';
import * as agendamentoController from '../../controllers/agendamentoController';
import * as veiculoController from '../../controllers/veiculoController';
import { STATUS_ROTULOS } from '../../entities/Agendamento';
import { formatarDataPorExtenso, formatarMoeda, formatarPlaca } from '../../utils/formatters';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing } from '../../theme';

const iconesPorCategoria = { Exterior: 'water-outline', Pintura: 'sparkles-outline', Interior: 'leaf-outline', Proteção: 'shield-checkmark-outline', Outros: 'car-outline' };
const mesesAbreviados = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { width, fontScale } = useWindowDimensions();
  const [dados, setDados] = useState({ servicos: [], proximo: null, veiculo: null });
  const [loading, setLoading] = useState({ servicos: true, proximo: true, veiculo: true });
  const [erro, setErro] = useState({});
  const requisicao = useRef({ servicos: 0, proximo: 0, veiculo: 0 });
  const emFoco = useRef(false);
  const carregar = useCallback((tipos = ['servicos', 'proximo', 'veiculo']) => {
    const consultas = {
      servicos: async () => (await servicoController.listar({ apenasAtivos: true })).slice(0, 3),
      proximo: () => agendamentoController.proximo(user?.uid),
      veiculo: async () => (await veiculoController.listar(user?.uid))[0] ?? null,
    };
    for (const tipo of tipos) {
      const atual = ++requisicao.current[tipo];
      setLoading(estado => ({ ...estado, [tipo]: true }));
      setErro(estado => ({ ...estado, [tipo]: '' }));
      Promise.resolve().then(consultas[tipo]).then(resultado => {
        if (emFoco.current && atual === requisicao.current[tipo]) setDados(estado => ({ ...estado, [tipo]: resultado }));
      }).catch(error => {
        if (emFoco.current && atual === requisicao.current[tipo]) setErro(estado => ({ ...estado, [tipo]: error.message }));
      }).finally(() => {
        if (emFoco.current && atual === requisicao.current[tipo]) setLoading(estado => ({ ...estado, [tipo]: false }));
      });
    }
  }, [user?.uid]);
  useFocusEffect(useCallback(() => {
    emFoco.current = true;
    carregar();
    return () => { emFoco.current = false; for (const tipo of Object.keys(requisicao.current)) ++requisicao.current[tipo]; };
  }, [carregar]));
  const primeiroNome = user?.nome?.split(' ')[0] || 'cliente';
  const { proximo, veiculo, servicos } = dados;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>ESTÉTICA AUTOMOTIVA</Text>
            <Text style={styles.greeting}>Olá, {primeiroNome}</Text>
          </View>
          <Pressable style={styles.bell} accessibilityRole="button" accessibilityLabel="Ver agenda" onPress={() => navigation.navigate('Agenda')}>
            <Ionicons name="calendar-outline" size={21} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>SEU CARRO, DO SEU JEITO</Text>
            <Text style={styles.heroTitle}>Cuidado que{`\n`}você percebe.</Text>
            <Text style={styles.heroText}>Agende seu próximo momento de brilho em poucos toques.</Text>
            <Pressable accessibilityRole="button" style={styles.heroButton} onPress={() => navigation.navigate('Serviços')}>
              <Text style={styles.heroButtonText}>Ver serviços</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.dark} />
            </Pressable>
          </View>
          {width > 360 && fontScale <= 1.2 ? <View style={styles.heroShape}>
            <Ionicons name="car-sport-outline" size={72} color={colors.primary} />
            <Text style={styles.heroShapeText}>BRILHO{`\n`}AUTÊNTICO</Text>
          </View> : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximo cuidado</Text>
          <Pressable accessibilityRole="button" style={styles.sectionLink} onPress={() => navigation.navigate('Agenda')}><Text style={styles.link}>Ver agenda</Text></Pressable>
        </View>
        {loading.proximo ? <Loading message="Carregando próximo cuidado…" /> : erro.proximo ? <View style={styles.feedback}>
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro.proximo}</Text>
          <Button title="Atualizar próximo cuidado" variant="outline" onPress={() => carregar(['proximo'])} />
        </View> : proximo ? <Pressable accessibilityRole="button" accessibilityLabel="Ver próximo agendamento na agenda" style={styles.bookingCard} onPress={() => navigation.navigate('Agenda')}>
          <View style={styles.dateBadge}><Text style={styles.dateDay}>{proximo.data.slice(8, 10)}</Text><Text style={styles.dateMonth}>{mesesAbreviados[Number(proximo.data.slice(5, 7)) - 1]}</Text></View>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingTitle}>{proximo.servico?.nome || 'Serviço não encontrado'}</Text>
            <Text style={styles.bookingMeta}>{formatarDataPorExtenso(proximo.data)}</Text>
            <Text style={styles.bookingMeta}>{proximo.horaInicio} - {proximo.horaFim}</Text>
            <Text style={styles.bookingMeta}>{proximo.veiculo ? proximo.veiculo.marca + ' ' + proximo.veiculo.modelo + ' · ' + formatarPlaca(proximo.veiculo.placa) : 'Veículo não encontrado'}</Text>
            <Text style={styles.bookingStatus}>{STATUS_ROTULOS[proximo.status] || 'Status não informado'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable> : <View style={styles.feedback}>
          <EmptyState title="Seu próximo cuidado começa aqui" description="Escolha um serviço para agendar seu próximo cuidado." />
          <Button title="Agendar um serviço" variant="outline" onPress={() => navigation.navigate('Serviços')} />
        </View>}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Escolha seu cuidado</Text>
          <Pressable accessibilityRole="button" style={styles.sectionLink} onPress={() => navigation.navigate('Serviços')}><Text style={styles.link}>Ver todos</Text></Pressable>
        </View>
        {loading.servicos ? <Loading message="Carregando destaques…" /> : erro.servicos ? <View style={styles.feedback}>
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro.servicos}</Text>
          <Button title="Tentar novamente" variant="outline" onPress={() => carregar(['servicos'])} />
        </View> : servicos.length === 0 ? <EmptyState title="Nenhum serviço disponível" description="Novos cuidados aparecerão aqui em breve." /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceRow}>
          {servicos.map(servico => (
            <Pressable key={servico.id} accessibilityRole="button" accessibilityLabel={'Ver detalhes de ' + servico.nome} style={styles.serviceCard} onPress={() => navigation.navigate('ServiceDetail', { id: servico.id })}>
              <View style={styles.serviceIcon}><Ionicons name={iconesPorCategoria[servico.categoria] || iconesPorCategoria.Outros} size={22} color={colors.primary} /></View>
              <Text style={styles.serviceName}>{servico.nome}</Text>
              <Text numberOfLines={2} style={styles.serviceDescription}>{servico.descricao}</Text>
              <Text style={styles.servicePrice}>{formatarMoeda(servico.preco)}</Text>
            </Pressable>
          ))}
        </ScrollView>}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sua garagem</Text>
          <Pressable accessibilityRole="button" style={styles.sectionLink} onPress={() => navigation.navigate('Veículos')}><Text style={styles.link}>Ver veículos</Text></Pressable>
        </View>
        {loading.veiculo ? <Loading message="Carregando sua garagem…" /> : erro.veiculo ? <View style={styles.feedback}>
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro.veiculo}</Text>
          <Button title="Atualizar garagem" variant="outline" onPress={() => carregar(['veiculo'])} />
        </View> : veiculo ? <Pressable accessibilityRole="button" accessibilityLabel="Ver veículos da garagem" style={styles.bookingCard} onPress={() => navigation.navigate('Veículos')}>
          <View style={styles.dateBadge}><Ionicons name="car-sport-outline" size={28} color={colors.primary} /></View>
          <View style={styles.bookingInfo}><Text style={styles.bookingTitle}>{veiculo.marca} {veiculo.modelo}</Text><Text style={styles.bookingMeta}>{veiculo.ano} · {formatarPlaca(veiculo.placa)}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable> : <View style={styles.feedback}>
          <EmptyState title="Sua garagem está vazia" description="Cadastre seu veículo para escolher o carro certo ao agendar." />
          <Button title="Cadastrar veículo" variant="outline" onPress={() => navigation.navigate('AddVehicle')} />
        </View>}

        <View style={styles.tipCard}><Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} /><View style={styles.tipCopy}><Text style={styles.tipTitle}>Seu carro em boas mãos</Text><Text style={styles.tipText}>Produtos profissionais e atenção em cada detalhe.</Text></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  feedback: { gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: 768, alignSelf: 'center', padding: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  greeting: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 232, backgroundColor: colors.dark, borderRadius: radii.lg, padding: spacing.lg, flexDirection: 'row', overflow: 'hidden' },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: colors.white, fontSize: 28, lineHeight: 31, fontWeight: '800', marginTop: 10 },
  heroText: { color: colors.textOnDarkMuted, fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 210 },
  heroButton: { alignSelf: 'flex-start', minHeight: 44, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 11, paddingHorizontal: 16, marginTop: 18 },
  heroButtonText: { color: colors.dark, fontWeight: '800', fontSize: 13, flexShrink: 1 },
  heroShape: { position: 'absolute', right: -24, bottom: -18, width: 170, height: 170, borderRadius: 90, borderWidth: 1, borderColor: colors.heroOutline, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-15deg' }] },
  heroShapeText: { color: colors.heroCaption, fontSize: 10, lineHeight: 13, letterSpacing: 1.7, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, marginBottom: -8 },
  sectionLink: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  link: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  bookingCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateBadge: { width: 48, height: 54, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.dark, fontSize: 20, fontWeight: '800' },
  dateMonth: { color: colors.primary, fontSize: 10, fontWeight: '800', marginTop: 1 },
  bookingInfo: { flex: 1, gap: 4 },
  bookingTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  bookingMeta: { color: colors.muted, fontSize: 12 },
  bookingStatus: { color: colors.text, fontSize: 12, fontWeight: '700' },
  serviceRow: { gap: 12, paddingRight: spacing.lg },
  serviceCard: { width: 174, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, gap: 8 },
  serviceIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  serviceName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  serviceDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, minHeight: 34 },
  servicePrice: { color: colors.primary, fontSize: 15, fontWeight: '800', marginTop: 3 },
  tipCard: { backgroundColor: colors.noticeBackground, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', gap: 12, alignItems: 'center' },
  tipCopy: { flex: 1, gap: 3 },
  tipTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  tipText: { color: colors.muted, fontSize: 12 },
});
