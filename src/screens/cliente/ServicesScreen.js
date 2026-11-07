import React, { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as servicoController from '../../controllers/servicoController';
import { CATEGORIAS } from '../../entities/Servico';
import { formatarMoeda } from '../../utils/formatters';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { colors, radii, spacing } from '../../theme';

const iconesPorCategoria = { Exterior: 'water-outline', Pintura: 'sparkles-outline', Interior: 'leaf-outline', Proteção: 'shield-checkmark-outline', Outros: 'car-outline' };
const filtros = ['Todos', ...CATEGORIAS];
function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;
  return horas ? horas + ' h' + (restante ? ' ' + restante + ' min' : '') : minutos + ' min';
}

export default function ServicesScreen({ navigation }) {
  const [filtro, setFiltro] = useState('Todos');
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');
  const emFoco = useRef(false);
  const requisicao = useRef(0);
  const carregar = useCallback(async (atualizar = false) => {
    const atual = ++requisicao.current;
    setErro('');
    setRefreshing(atualizar);
    if (!atualizar) setLoading(true);
    try {
      const dados = await servicoController.listar({ apenasAtivos: true });
      if (emFoco.current && atual === requisicao.current) setServicos(dados);
    } catch (error) {
      if (emFoco.current && atual === requisicao.current) setErro(error.message);
    } finally {
      if (emFoco.current && atual === requisicao.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);
  useFocusEffect(useCallback(() => {
    emFoco.current = true;
    carregar();
    return () => { emFoco.current = false; ++requisicao.current; };
  }, [carregar]));
  const lista = filtro === 'Todos' ? servicos : servicos.filter(item => item.categoria === filtro);
  const abrirDetalhe = id => navigation.navigate('ServiceDetail', { id });
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => carregar(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
        <Text style={styles.eyebrow}>CATÁLOGO DE CUIDADOS</Text>
        <Text style={styles.title}>Escolha o seu{`\n`}próximo cuidado.</Text>
        <Text style={styles.subtitle}>Serviços pensados para manter seu carro sempre no melhor estado.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filtros.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filtro === item }} onPress={() => setFiltro(item)} style={[styles.filter, filtro === item && styles.filterActive]}><Text style={[styles.filterText, filtro === item && styles.filterTextActive]}>{item}</Text></Pressable>)}
        </ScrollView>
        {loading ? <Loading message="Carregando serviços…" /> : <>
          {erro ? <View style={styles.list}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text><Button title="Tentar novamente" variant="outline" onPress={() => carregar(true)} /></View> : null}
          {!erro && lista.length === 0 ? <EmptyState title={filtro === 'Todos' ? 'Nenhum serviço disponível' : 'Nenhum serviço nesta categoria'} description="Novos cuidados aparecerão aqui quando estiverem disponíveis." /> : null}
          <View style={styles.list}>
            {lista.map(servico => (
              <Pressable key={servico.id} accessibilityRole="button" accessibilityLabel={'Ver detalhes e agendar ' + servico.nome} style={styles.card} onPress={() => abrirDetalhe(servico.id)}>
                <View style={styles.icon}><Ionicons name={iconesPorCategoria[servico.categoria] || iconesPorCategoria.Outros} size={23} color={colors.primary} /></View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.name}>{servico.nome}</Text>
                    <Text style={styles.price}>{formatarMoeda(servico.preco)}</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.description}>{servico.descricao}</Text>
                  <View style={styles.meta}>
                    <Text style={styles.duration}><Ionicons name="time-outline" size={14} color={colors.muted} /> {formatarDuracao(servico.duracaoMin)}</Text>
                    <View style={styles.book}>
                      <Text style={styles.bookText}>Agendar</Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.dark} />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: 14 },
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: 768, alignSelf: 'center', padding: spacing.lg, gap: spacing.md },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 30, lineHeight: 33, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, maxWidth: 340 },
  filters: { gap: 8, paddingVertical: 8 },
  filter: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 15, backgroundColor: colors.card },
  filterActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  list: { gap: 12 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', gap: 13 },
  icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, minWidth: 0, gap: 7 },
  cardTop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  name: { color: colors.text, fontSize: 15, fontWeight: '800', flexGrow: 1, flexBasis: '55%' },
  price: { color: colors.text, fontSize: 15, fontWeight: '800', flexShrink: 1 },
  description: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  duration: { color: colors.muted, fontSize: 12 },
  book: { minHeight: 44, maxWidth: '100%', backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  bookText: { color: colors.dark, fontSize: 12, fontWeight: '800', flexShrink: 1 },
});
