import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as servicoController from '../../controllers/servicoController';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { formatarMoeda } from '../../utils/formatters';
import { colors, spacing } from '../../theme';

function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;
  if (!horas) return minutos + ' min';
  return horas + ' h' + (restante ? ' ' + restante + ' min' : '');
}

export default function ServicosAdminScreen({ navigation }) {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');
  const [idAlterando, setIdAlterando] = useState(null);
  const requisicao = useRef(0);
  const emFoco = useRef(false);
  const montado = useRef(true);
  const alterando = useRef(false);

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  const carregar = useCallback(async (atualizar = false) => {
    const atual = ++requisicao.current;
    setErro('');
    if (atualizar) setRefreshing(true);
    else setLoading(true);
    try {
      const dados = await servicoController.listar({ apenasAtivos: false });
      if (emFoco.current && atual === requisicao.current) setServicos(dados);
    } catch (error) {
      if (emFoco.current && atual === requisicao.current) setErro(error.message);
    } finally {
      if (emFoco.current && atual === requisicao.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    emFoco.current = true;
    carregar();
    return () => { emFoco.current = false; ++requisicao.current; };
  }, [carregar]));

  async function alternar(servico) {
    if (alterando.current) return;
    alterando.current = true;
    ++requisicao.current;
    setRefreshing(false);
    setIdAlterando(servico.id);
    setErro('');
    try {
      const atualizado = await servicoController.alternarAtivo(servico.id, !servico.ativo);
      if (emFoco.current) {
        setServicos(atuais => atuais.map(item => item.id === atualizado.id ? atualizado : item));
        carregar(true);
      }
    } catch (error) {
      if (emFoco.current) setErro(error.message);
    } finally {
      alterando.current = false;
      if (montado.current) setIdAlterando(null);
    }
  }

  function abrirFormulario(id) {
    if (!alterando.current) navigation.navigate('ServiceForm', id ? { id } : undefined);
  }

  if (loading) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><Loading message="Carregando serviços…" /></SafeAreaView>;

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <FlatList
        data={servicos}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { if (!alterando.current) carregar(true); }} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.section}>
            <Button title="Novo serviço" disabled={Boolean(idAlterando)} onPress={() => abrirFormulario()} />
            {erro ? <View style={styles.feedback}>
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text>
              <Button title="Tentar novamente" variant="outline" disabled={Boolean(idAlterando)} onPress={() => carregar(true)} />
            </View> : null}
          </View>
        }
        ListEmptyComponent={!erro ? <EmptyState title="Nenhum serviço cadastrado" description="Toque em Novo serviço para começar." /> : null}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Card>
              <Pressable accessibilityRole="button" accessibilityLabel={'Editar serviço ' + item.nome} disabled={Boolean(idAlterando)} onPress={() => abrirFormulario(item.id)} style={styles.details}>
                <Text style={styles.name}>{item.nome}</Text>
                <Text style={styles.price}>{formatarMoeda(item.preco)}</Text>
                <Text style={styles.duration}>Duração: {formatarDuracao(item.duracaoMin)}</Text>
                <Text style={[styles.badge, item.ativo ? styles.active : styles.inactive]}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
              </Pressable>
              <Button title={item.ativo ? 'Inativar' : 'Ativar'} variant="outline" loading={idAlterando === item.id} disabled={Boolean(idAlterando)} onPress={() => alternar(item)} />
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
  section: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  feedback: { marginTop: spacing.md, gap: spacing.sm },
  details: { gap: spacing.sm, paddingVertical: spacing.sm },
  name: { color: colors.text, fontSize: 20, fontWeight: '600' },
  price: { color: colors.primary, fontSize: 18, fontWeight: '600' },
  duration: { color: colors.muted, fontSize: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8, color: colors.card, fontSize: 14, fontWeight: '600' },
  active: { backgroundColor: colors.success },
  inactive: { backgroundColor: colors.muted },
  error: { color: colors.danger, fontSize: 14 },
});
