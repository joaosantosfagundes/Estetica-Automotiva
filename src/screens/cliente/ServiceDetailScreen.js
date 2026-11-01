import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as servicoController from '../../controllers/servicoController';
import { formatarMoeda } from '../../utils/formatters';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { colors, radii, spacing } from '../../theme';

const iconesPorCategoria = { Exterior: 'water-outline', Pintura: 'sparkles-outline', Interior: 'leaf-outline', Proteção: 'shield-checkmark-outline', Outros: 'car-outline' };
function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;
  return horas ? horas + 'h' + (restante ? ' ' + restante + 'min' : '') : minutos + 'min';
}

export default function ServiceDetailScreen({ route, navigation }) {
  const id = route?.params?.id;
  const [servico, setServico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  useFocusEffect(useCallback(() => {
    let ativo = true;
    setLoading(true);
    setErro('');
    setServico(null);
    servicoController.buscar(id).then(dados => {
      if (ativo) setServico(dados.ativo ? dados : null);
    }).catch(error => {
      if (ativo && error.code !== 'servico/nao-encontrado') setErro(error.message);
    }).finally(() => {
      if (ativo) setLoading(false);
    });
    return () => { ativo = false; };
  }, [id, tentativa]));

  if (loading) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><Loading message="Carregando serviço…" /></SafeAreaView>;
  if (erro) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><View style={styles.feedback}>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text>
    <Button title="Tentar novamente" onPress={() => setTentativa(valor => valor + 1)} />
  </View></SafeAreaView>;
  if (!servico) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><View style={styles.feedback}>
    <EmptyState title="Serviço indisponível" description="Este serviço não está disponível para agendamento." />
    <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} />
  </View></SafeAreaView>;
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name={iconesPorCategoria[servico.categoria] || iconesPorCategoria.Outros} size={32} color={colors.primary} /></View>
          <Text style={styles.category}>{servico.categoria}</Text>
          <Text accessibilityRole="header" style={styles.title}>{servico.nome}</Text>
          <Text style={styles.description}>{servico.descricao || 'Descrição não informada.'}</Text>
          <Text style={styles.price}>{formatarMoeda(servico.preco)}</Text>
          <Text style={styles.duration}>Duração: {formatarDuracao(servico.duracaoMin)}</Text>
          <Button title="Agendar" onPress={() => navigation.navigate('Book', { servicoId: servico.id })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.lg, alignItems: 'center' },
  card: { width: '100%', maxWidth: 600, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  icon: { width: 64, height: 64, borderRadius: radii.md, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  category: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  price: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  duration: { color: colors.muted, fontSize: 14 },
  feedback: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center', width: '100%', maxWidth: 600, alignSelf: 'center' },
  error: { color: colors.danger, fontSize: 14 },
});
