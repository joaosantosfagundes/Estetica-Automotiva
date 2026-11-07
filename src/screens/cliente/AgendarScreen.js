import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import * as servicoController from '../../controllers/servicoController';
import * as veiculoController from '../../controllers/veiculoController';
import * as configuracaoController from '../../controllers/configuracaoController';
import * as agendamentoController from '../../controllers/agendamentoController';
import { lerUltimoVeiculo, salvarUltimoVeiculo } from '../../utils/preferencias';
import { formatarData, formatarMoeda, formatarPlaca } from '../../utils/formatters';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { colors, radii, spacing } from '../../theme';

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const chaveData = data => [data.getFullYear(), String(data.getMonth() + 1).padStart(2, '0'), String(data.getDate()).padStart(2, '0')].join('-');
function proximosDias(hoje) {
  const [ano, mes, dia] = hoje.split('-').map(Number);
  return Array.from({ length: 14 }, (_, indice) => new Date(ano, mes - 1, dia + indice, 12));
}
function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60), restante = minutos % 60;
  return horas ? horas + ' h' + (restante ? ' ' + restante + ' min' : '') : minutos + ' min';
}

export default function AgendarScreen({ route, navigation }) {
  const { user } = useAuth();
  const servicoId = route?.params?.servicoId;
  const [servico, setServico] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [horario, setHorario] = useState(null);
  const [hoje, setHoje] = useState(() => chaveData(new Date()));
  const [vehicleId, setVehicleId] = useState('');
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [erroHorarios, setErroHorarios] = useState('');
  const [erroEnvio, setErroEnvio] = useState('');
  const [campos, setCampos] = useState({});
  const emFoco = useRef(false);
  const montado = useRef(true);
  const requisicao = useRef(0);
  const requisicaoHorarios = useRef(0);
  const enviando = useRef(false);
  const concluido = useRef(false);
  const identidade = useRef('');
  identidade.current = user?.uid + ':' + servicoId;

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  const carregar = useCallback(async () => {
    if (concluido.current) return;
    const atual = ++requisicao.current;
    ++requisicaoHorarios.current;
    setLoading(true); setErro(''); setErroEnvio(''); setCampos({}); setHoraInicio('');
    try {
      const [servicoAtual, configuracao, listaVeiculos, ultimoVeiculo] = await Promise.all([
        servicoController.buscar(servicoId), configuracaoController.obter(),
        veiculoController.listar(user?.uid), lerUltimoVeiculo(),
      ]);
      if (!emFoco.current || atual !== requisicao.current) return;
      const hojeAtual = chaveData(new Date());
      const diasPermitidos = proximosDias(hojeAtual).filter(dia => configuracao.diasFuncionamento.includes(dia.getDay())).map(chaveData);
      setServico(servicoAtual); setHorario(configuracao); setVeiculos(listaVeiculos); setHoje(hojeAtual);
      setVehicleId(anterior => listaVeiculos.some(item => item.id === anterior) ? anterior : listaVeiculos.some(item => item.id === ultimoVeiculo) ? ultimoVeiculo : '');
      setData(anterior => diasPermitidos.includes(anterior) ? anterior : '');
    } catch (error) {
      if (emFoco.current && atual === requisicao.current) setErro(error.message);
    } finally {
      if (emFoco.current && atual === requisicao.current) setLoading(false);
    }
  }, [servicoId, user?.uid]);

  useFocusEffect(useCallback(() => {
    emFoco.current = true;
    carregar();
    return () => { emFoco.current = false; ++requisicao.current; ++requisicaoHorarios.current; };
  }, [carregar]));

  const carregarHorarios = useCallback(async dia => {
    const atual = ++requisicaoHorarios.current;
    setLoadingHorarios(true); setErroHorarios(''); setHorarios([]); setHoraInicio('');
    try {
      const lista = await agendamentoController.horariosDisponiveis(dia, servicoId);
      if (emFoco.current && atual === requisicaoHorarios.current) setHorarios(lista);
    } catch (error) {
      if (emFoco.current && atual === requisicaoHorarios.current) setErroHorarios(error.message);
    } finally {
      if (emFoco.current && atual === requisicaoHorarios.current) setLoadingHorarios(false);
    }
  }, [servicoId]);

  useEffect(() => {
    if (loading || erro || !servico?.ativo || !data || !horario) {
      ++requisicaoHorarios.current;
      setHorarios([]); setHoraInicio(''); setLoadingHorarios(false);
      return;
    }
    carregarHorarios(data);
    return () => { ++requisicaoHorarios.current; };
  }, [data, horario, loading, erro, servico?.ativo, carregarHorarios]);

  function selecionarData(dia) {
    if (enviando.current || concluido.current || dia === data) return;
    ++requisicaoHorarios.current;
    setData(dia); setHoraInicio(''); setHorarios([]); setErroHorarios(''); setErroEnvio('');
    setCampos(atuais => ({ ...atuais, data: undefined, horaInicio: undefined }));
  }

  function irParaAgenda() {
    navigation.popTo('ClientTabs', { screen: 'Agenda' });
  }

  async function confirmar() {
    if (enviando.current || concluido.current || loading || loadingHorarios || !vehicleId || !data || !horaInicio) return;
    enviando.current = true;
    const identidadeAtual = identidade.current;
    setSalvando(true); setErroEnvio(''); setCampos({});
    try {
      await agendamentoController.agendar(user?.uid, { vehicleId, servicoId, data, horaInicio });
      concluido.current = true;
      await salvarUltimoVeiculo(vehicleId);
      if (montado.current && identidadeAtual === identidade.current) {
        setSucesso(true);
        if (emFoco.current) Alert.alert('Agendamento realizado', 'Sua solicitação está pendente de confirmação da estética.', [
          { text: 'Ver agenda', onPress: irParaAgenda },
        ], { cancelable: false });
      }
    } catch (error) {
      if (emFoco.current && identidadeAtual === identidade.current) {
        setErroEnvio(error.message); setCampos(error.campos || {});
        if (error.code === 'agendamento/horario-indisponivel') await carregarHorarios(data);
      }
    } finally {
      enviando.current = false;
      if (montado.current && identidadeAtual === identidade.current) setSalvando(false);
    }
  }

  if (sucesso) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><View style={styles.feedback}>
    <EmptyState title="Agendamento realizado" description="Sua solicitação está pendente de confirmação da estética." />
    <Button title="Ver agenda" onPress={irParaAgenda} />
  </View></SafeAreaView>;
  if (loading) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><Loading message="Carregando agendamento…" /></SafeAreaView>;
  if (erro) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><View style={styles.feedback}>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text>
    <Button title="Tentar novamente" onPress={carregar} />
  </View></SafeAreaView>;
  if (!servico?.ativo) return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}><View style={styles.feedback}>
    <EmptyState title="Serviço indisponível" description="Este serviço não está disponível para agendamento." />
    <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} />
  </View></SafeAreaView>;

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.eyebrow}>SEU PRÓXIMO CUIDADO</Text>
          <Text accessibilityRole="header" style={styles.title}>Agendar serviço</Text>
          <Card>
            <Text style={styles.category}>{servico.categoria}</Text>
            <Text style={styles.service}>{servico.nome}</Text>
            <Text style={styles.price}>{formatarMoeda(servico.preco)}</Text>
            <Text style={styles.secondary}>Duração: {formatarDuracao(servico.duracaoMin)}</Text>
          </Card>

          <Text accessibilityRole="header" style={styles.heading}>1. Escolha o veículo</Text>
          {!veiculos.length ? <EmptyState title="Nenhum veículo cadastrado" description="Adicione um veículo à sua garagem para agendar." /> : veiculos.map(veiculo => (
            <Card key={veiculo.id}>
              <Pressable accessibilityRole="radio" accessibilityLabel={veiculo.marca + ' ' + veiculo.modelo + ', ' + formatarPlaca(veiculo.placa)}
                accessibilityState={{ checked: vehicleId === veiculo.id, disabled: salvando }} disabled={salvando}
                onPress={() => { if (!enviando.current) { setVehicleId(veiculo.id); setCampos(atuais => ({ ...atuais, vehicleId: undefined })); setErroEnvio(''); } }}
                style={[styles.vehicle, vehicleId === veiculo.id && styles.selectedVehicle]}>
                <Ionicons name={vehicleId === veiculo.id ? 'radio-button-on' : 'radio-button-off'} size={23} color={colors.primary} />
                <View style={styles.vehicleCopy}><Text style={styles.vehicleName}>{veiculo.marca} {veiculo.modelo}</Text><Text style={styles.secondary}>{veiculo.ano} · {formatarPlaca(veiculo.placa)}</Text></View>
              </Pressable>
            </Card>
          ))}
          {campos.vehicleId ? <Text accessibilityRole="alert" style={styles.error}>{campos.vehicleId}</Text> : null}
          <Button title="Adicionar veículo" variant="outline" disabled={salvando} onPress={() => navigation.navigate('AddVehicle')} />

          <Text accessibilityRole="header" style={styles.heading}>2. Escolha a data</Text>
          <Text style={styles.secondary}>Funcionamento: {horario.abertura} às {horario.fechamento}. Dias fechados ficam desabilitados.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {proximosDias(hoje).map(dia => {
              const chave = chaveData(dia), fechado = !horario.diasFuncionamento.includes(dia.getDay()), selecionado = chave === data;
              return <Pressable key={chave} accessibilityRole="button" accessibilityLabel={(chave === hoje ? 'Hoje, ' : '') + diasSemana[dia.getDay()] + ', ' + formatarData(chave)}
                accessibilityHint={fechado ? 'A estética não funciona neste dia.' : 'Consultar horários disponíveis.'}
                accessibilityState={{ selected: selecionado, disabled: fechado || salvando }} disabled={fechado || salvando}
                onPress={() => selecionarData(chave)} style={[styles.day, chave === hoje && styles.today, selecionado && styles.selectedDay, fechado && styles.disabledDay]}>
                <Text style={[styles.dayLabel, selecionado && styles.selectedText]}>{chave === hoje ? 'Hoje' : diasSemana[dia.getDay()]}</Text>
                <Text style={[styles.dayNumber, selecionado && styles.selectedText]}>{formatarData(chave).slice(0, 5)}</Text>
              </Pressable>;
            })}
          </ScrollView>
          {campos.data ? <Text accessibilityRole="alert" style={styles.error}>{campos.data}</Text> : null}

          <Text accessibilityRole="header" style={styles.heading}>3. Escolha o horário</Text>
          {!data ? <Text style={styles.secondary}>Selecione uma data para consultar os horários.</Text> : loadingHorarios ? <Loading message="Carregando horários…" /> : erroHorarios ? <View style={styles.actions}>
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erroHorarios}</Text>
            <Button title="Tentar carregar horários" variant="outline" disabled={salvando} onPress={() => carregarHorarios(data)} />
          </View> : !horarios.length ? <EmptyState title="Sem horários livres neste dia" description="Escolha outra data para agendar este serviço." /> : <View style={styles.times}>
            {horarios.map(hora => <Pressable key={hora} accessibilityRole="button" accessibilityLabel={'Horário ' + hora} accessibilityState={{ selected: horaInicio === hora, disabled: salvando }} disabled={salvando}
              onPress={() => { if (!enviando.current) { setHoraInicio(hora); setCampos(atuais => ({ ...atuais, horaInicio: undefined })); setErroEnvio(''); } }}
              style={[styles.time, horaInicio === hora && styles.selectedDay]}><Text style={[styles.timeLabel, horaInicio === hora && styles.selectedText]}>{hora}</Text></Pressable>)}
          </View>}
          {campos.horaInicio ? <Text accessibilityRole="alert" style={styles.error}>{campos.horaInicio}</Text> : null}
          {erroEnvio ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erroEnvio}</Text> : null}
          <Button title="Confirmar agendamento" loading={salvando} disabled={!vehicleId || !data || !horaInicio || loadingHorarios || Boolean(erroHorarios)} onPress={confirmar} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.md },
  section: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.md },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  category: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  service: { color: colors.text, fontSize: 22, fontWeight: '800' },
  price: { color: colors.primary, fontSize: 23, fontWeight: '800' },
  secondary: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  heading: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: spacing.sm },
  vehicle: { minHeight: 56, padding: spacing.sm, borderRadius: radii.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectedVehicle: { backgroundColor: colors.primarySoft },
  vehicleCopy: { flex: 1, gap: spacing.xs },
  vehicleName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  days: { gap: spacing.sm },
  day: { minWidth: 66, minHeight: 66, padding: spacing.sm, gap: spacing.xs, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  today: { borderColor: colors.primary, borderWidth: 2 },
  selectedDay: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabledDay: { opacity: 0.4 },
  dayLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  dayNumber: { color: colors.text, fontSize: 15, fontWeight: '800' },
  selectedText: { color: colors.dark },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  time: { minWidth: 72, minHeight: 44, padding: spacing.sm, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  timeLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  actions: { gap: spacing.sm },
  feedback: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.md, justifyContent: 'center', gap: spacing.md },
  error: { color: colors.danger, fontSize: 14 },
});
