import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import * as veiculoController from '../../controllers/veiculoController';
import { formatarPlaca } from '../../utils/formatters';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { colors, radii, spacing } from '../../theme';

function VeiculoCard({ veiculo, ocupado, onRemover }) {
  const [fotoFalhou, setFotoFalhou] = useState(false);
  useEffect(() => { setFotoFalhou(false); }, [veiculo.fotoUri]);
  return <View style={styles.vehicleCard}>
    <View style={styles.carVisual}>{veiculo.fotoUri && !fotoFalhou ? <Image source={{ uri: veiculo.fotoUri }} accessibilityLabel={'Foto de ' + veiculo.marca + ' ' + veiculo.modelo} style={styles.photo} onError={() => setFotoFalhou(true)} /> : <Ionicons name="car-sport-outline" size={70} color={colors.primary} />}</View>
    <View style={styles.vehicleInfo}><Text style={styles.vehicleName}>{veiculo.marca} {veiculo.modelo}</Text><Text style={styles.vehicleDetail}>{veiculo.ano}</Text><View style={styles.plate}><Text style={styles.plateText}>{formatarPlaca(veiculo.placa)}</Text></View></View>
    <Pressable accessibilityRole="button" accessibilityLabel={'Remover veículo ' + formatarPlaca(veiculo.placa)} disabled={ocupado} style={styles.more} onPress={() => onRemover(veiculo)}><Ionicons name="trash-outline" size={20} color={colors.muted} /></Pressable>
  </View>;
}

export default function VehiclesScreen({ navigation }) {
  const { user } = useAuth();
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmar, setConfirmar] = useState(null);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState('');
  const montado = useRef(true);
  const emFoco = useRef(false);
  const requisicao = useRef(0);
  const bloqueio = useRef(false);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  const carregar = useCallback(async (atualizar = false) => {
    const atual = ++requisicao.current;
    setErro(''); setRefreshing(atualizar); if (!atualizar) setLoading(true);
    try {
      const dados = await veiculoController.listar(user?.uid);
      if (emFoco.current && atual === requisicao.current) setVeiculos(dados);
    } catch (error) { if (emFoco.current && atual === requisicao.current) setErro(error.message); }
    finally { if (emFoco.current && atual === requisicao.current) { setLoading(false); setRefreshing(false); } }
  }, [user?.uid]);
  useFocusEffect(useCallback(() => {
    emFoco.current = true; carregar();
    return () => { emFoco.current = false; ++requisicao.current; };
  }, [carregar]));
  async function remover() {
    if (bloqueio.current || !confirmar) return;
    bloqueio.current = true; setRemovendo(true); setErroRemocao('');
    ++requisicao.current; setRefreshing(false);
    try {
      await veiculoController.remover(user?.uid, confirmar.id);
      if (montado.current) { setVeiculos(atuais => atuais.filter(item => item.id !== confirmar.id)); setConfirmar(null); if (emFoco.current) carregar(true); }
    } catch (error) { if (montado.current) setErroRemocao(error.message); }
    finally { bloqueio.current = false; if (montado.current) setRemovendo(false); }
  }
  return <SafeAreaView edges={['bottom']} style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { if (!bloqueio.current) carregar(true); }} tintColor={colors.primary} colors={[colors.primary]} />}>
      <Text style={styles.eyebrow}>GARAGEM</Text><Text style={styles.title}>Seus veículos</Text><Text style={styles.subtitle}>Tenha seus carros sempre à mão na hora de agendar.</Text>
      {loading ? <Loading message="Carregando veículos…" /> : <>
        {erro ? <View style={styles.feedback}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text><Button title="Tentar novamente" variant="outline" onPress={() => carregar(true)} /></View> : null}
        {!erro && !veiculos.length ? <EmptyState title="Nenhum veículo cadastrado" description="Adicione seu primeiro veículo à garagem." /> : null}
        {veiculos.map(veiculo => <VeiculoCard key={veiculo.id} veiculo={veiculo} ocupado={removendo} onRemover={item => { setErroRemocao(''); setConfirmar(item); }} />)}
      </>}
      <Pressable accessibilityRole="button" disabled={removendo} style={styles.add} onPress={() => navigation.navigate('AddVehicle')}><Ionicons name="add" size={20} color={colors.dark} /><Text style={styles.addText}>Adicionar veículo</Text></Pressable>
      <View style={styles.note}><Ionicons name="information-circle-outline" size={22} color={colors.primary} /><Text style={styles.noteText}>Cadastre mais de um veículo para escolher o carro certo em cada agendamento.</Text></View>
    </ScrollView>
    <Modal visible={Boolean(confirmar)} transparent animationType="fade" onRequestClose={() => { if (!bloqueio.current) setConfirmar(null); }}>
      <View style={styles.modal}>
        <View style={styles.backdrop} />
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.dialogTitle}>Remover veículo?</Text>
          <Text style={styles.dialogText}>Deseja remover {confirmar?.marca} {confirmar?.modelo} da sua garagem?</Text>
          {erroRemocao ? <Text accessibilityRole="alert" style={styles.error}>{erroRemocao}</Text> : null}
          <Button title="Remover" variant="danger" loading={removendo} onPress={remover} />
          <Button title="Cancelar" variant="outline" disabled={removendo} onPress={() => setConfirmar(null)} />
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ photo: { width: '100%', height: '100%', borderRadius: 58 }, error: { color: colors.danger, fontSize: 14 }, feedback: { gap: spacing.sm }, modal: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }, backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.dark, opacity: 0.45 }, dialog: { width: '100%', maxWidth: 440, backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.lg, gap: spacing.md }, dialogTitle: { color: colors.text, fontSize: 20, fontWeight: '700' }, dialogText: { color: colors.muted, fontSize: 16 }, safe: { flex: 1, backgroundColor: colors.bg }, content: { padding: spacing.lg, gap: spacing.md }, eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 30, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 }, vehicleCard: { backgroundColor: colors.dark, borderRadius: radii.lg, padding: spacing.lg, minHeight: 190, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 }, carVisual: { width: 116, height: 116, borderRadius: 58, borderWidth: 1, borderColor: colors.vehicleOutline, alignItems: 'center', justifyContent: 'center' }, vehicleInfo: { flex: 1, gap: 5 }, vehicleName: { color: colors.white, fontSize: 21, fontWeight: '800' }, vehicleDetail: { color: colors.textOnDarkMuted, fontSize: 13 }, plate: { alignSelf: 'flex-start', backgroundColor: colors.plateBackground, borderRadius: 5, paddingVertical: 5, paddingHorizontal: 9, marginTop: 6 }, plateText: { color: colors.dark, fontWeight: '800', fontSize: 11, letterSpacing: 1 }, more: { position: 'absolute', top: 18, right: 18 }, add: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, addText: { color: colors.dark, fontWeight: '800', fontSize: 14 }, note: { backgroundColor: colors.noticeBackground, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10 }, noteText: { color: colors.muted, fontSize: 12, lineHeight: 18, flex: 1 } });
