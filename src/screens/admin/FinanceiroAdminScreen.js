import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as financeiroController from '../../controllers/financeiroController';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import { colors, radii, spacing } from '../../theme';
import { formatarMoeda } from '../../utils/formatters';

const formatarMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const formatarRecebimento = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function FinanceiroAdminScreen() {
  const [periodo, setPeriodo] = useState(() => new Date());
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState('');
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    const atual = ++requisicao.current;
    setResumo(null);
    setErro('');
    try {
      const dados = await financeiroController.listarDoMes(periodo.getFullYear(), periodo.getMonth() + 1);
      if (atual === requisicao.current) setResumo(dados);
    } catch (error) {
      if (atual === requisicao.current) setErro(error.message);
    }
  }, [periodo]);

  useFocusEffect(useCallback(() => {
    carregar();
    return () => { requisicao.current += 1; };
  }, [carregar]));

  function trocarMes(delta) {
    requisicao.current += 1;
    setResumo(null);
    setErro('');
    setPeriodo(atual => new Date(atual.getFullYear(), atual.getMonth() + delta, 1));
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <FlatList
        data={resumo?.entradas ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.title}>Entradas da estética</Text>
            <View style={styles.dateSelector}>
              <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" style={styles.arrow} onPress={() => trocarMes(-1)}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
              <Text accessibilityLiveRegion="polite" style={styles.month}>{formatarMes.format(periodo)}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" style={styles.arrow} onPress={() => trocarMes(1)}>
                <Ionicons name="chevron-forward" size={22} color={colors.text} />
              </Pressable>
            </View>
            {resumo ? <Card>
              <Text style={styles.secondary}>Total recebido no mês</Text>
              <Text style={styles.total}>{formatarMoeda(resumo.totalCentavos / 100)}</Text>
              <Text style={styles.secondary}>{resumo.entradas.length} {resumo.entradas.length === 1 ? 'entrada registrada' : 'entradas registradas'}</Text>
            </Card> : null}
            {erro ? <View style={styles.feedback}>
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text>
              <Button title="Tentar novamente" variant="outline" onPress={carregar} />
            </View> : null}
          </View>
        }
        ListEmptyComponent={erro ? null : resumo ? (
          <EmptyState title="Nenhuma entrada no mês" description="Os valores registrados ao concluir atendimentos aparecem aqui." />
        ) : <Loading message="Carregando entradas…" />}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Card>
              <Text style={styles.service}>{item.servicoNome}</Text>
              <Text style={styles.amount}>{formatarMoeda(item.valorCentavos / 100)}</Text>
              <Text style={styles.secondary}>Recebido em {formatarRecebimento.format(item.recebidoEm)}</Text>
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
  title: { color: colors.text, fontSize: 27, fontWeight: '800' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  arrow: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  month: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondary: { color: colors.muted, fontSize: 14 },
  total: { color: colors.text, fontSize: 28, fontWeight: '800' },
  service: { color: colors.text, fontSize: 18, fontWeight: '700' },
  amount: { color: colors.success, fontSize: 18, fontWeight: '700' },
  feedback: { gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
});
