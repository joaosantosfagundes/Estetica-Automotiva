import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import * as veiculoController from '../../controllers/veiculoController';
import { formatarPlaca } from '../../utils/formatters';
import AppError from '../../utils/AppError';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, radii, spacing } from '../../theme';

export default function VeiculoFormScreen({ navigation }) {
  const { user } = useAuth();
  const [marca, setMarca] = useState(null);
  const [modelo, setModelo] = useState(null);
  const [ano, setAno] = useState(null);
  const [placa, setPlaca] = useState('');
  const [fotoUri, setFotoUri] = useState('');
  const [opcoes, setOpcoes] = useState({ marcas: [], modelos: [], anos: [] });
  const [carregando, setCarregando] = useState({ marcas: true, modelos: false, anos: false });
  const [erroFipe, setErroFipe] = useState({});
  const [tentativa, setTentativa] = useState({ marcas: 0, modelos: 0, anos: 0 });
  const [campos, setCampos] = useState({});
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [selecionandoFoto, setSelecionandoFoto] = useState(false);
  const montado = useRef(true);
  const bloqueio = useRef(false);

  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  useEffect(() => {
    let ativo = true;
    setCarregando(atual => ({ ...atual, marcas: true }));
    setErroFipe(atual => ({ ...atual, marcas: '' }));
    veiculoController.listarMarcas().then(dados => { if (ativo) setOpcoes(atual => ({ ...atual, marcas: dados })); })
      .catch(error => { if (ativo) setErroFipe(atual => ({ ...atual, marcas: error.message })); })
      .finally(() => { if (ativo) setCarregando(atual => ({ ...atual, marcas: false })); });
    return () => { ativo = false; };
  }, [tentativa.marcas]);
  useEffect(() => {
    if (!marca) return undefined;
    let ativo = true;
    setCarregando(atual => ({ ...atual, modelos: true }));
    setErroFipe(atual => ({ ...atual, modelos: '' }));
    veiculoController.listarModelos(marca.value).then(dados => { if (ativo) setOpcoes(atual => ({ ...atual, modelos: dados })); })
      .catch(error => { if (ativo) setErroFipe(atual => ({ ...atual, modelos: error.message })); })
      .finally(() => { if (ativo) setCarregando(atual => ({ ...atual, modelos: false })); });
    return () => { ativo = false; };
  }, [marca, tentativa.modelos]);
  useEffect(() => {
    if (!marca || !modelo) return undefined;
    let ativo = true;
    setCarregando(atual => ({ ...atual, anos: true }));
    setErroFipe(atual => ({ ...atual, anos: '' }));
    veiculoController.listarAnos(marca.value, modelo.value).then(dados => {
      if (ativo) { setOpcoes(atual => ({ ...atual, anos: dados })); if (!dados.length) setErroFipe(atual => ({ ...atual, anos: 'Nenhum ano válido disponível para este modelo. Escolha outro modelo.' })); }
    }).catch(error => { if (ativo) setErroFipe(atual => ({ ...atual, anos: error.message })); })
      .finally(() => { if (ativo) setCarregando(atual => ({ ...atual, anos: false })); });
    return () => { ativo = false; };
  }, [marca, modelo, tentativa.anos]);

  function limparErros() { setCampos({}); setErro(''); }
  function selecionarMarca(item) {
    if (item.value === marca?.value) return;
    setMarca(item); setModelo(null); setAno(null);
    setOpcoes(atual => ({ ...atual, modelos: [], anos: [] }));
    setCarregando(atual => ({ ...atual, modelos: true, anos: false }));
    setErroFipe(atual => ({ ...atual, modelos: '', anos: '' })); limparErros();
  }
  function selecionarModelo(item) {
    if (item.value === modelo?.value) return;
    setModelo(item); setAno(null); setOpcoes(atual => ({ ...atual, anos: [] }));
    setCarregando(atual => ({ ...atual, anos: true }));
    setErroFipe(atual => ({ ...atual, anos: '' })); limparErros();
  }
  async function escolherFoto() {
    if (bloqueio.current) return;
    bloqueio.current = true; setSelecionandoFoto(true);
    setCampos(atual => ({ ...atual, fotoUri: undefined }));
    try {
      if (Platform.OS !== 'web') {
        const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissao.granted) throw new AppError('Acesso às fotos não permitido. Você pode salvar sem foto ou autorizar o acesso nas configurações.', 'foto/permissao');
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (montado.current && !resultado.canceled && resultado.assets?.[0]?.uri) setFotoUri(resultado.assets[0].uri);
    } catch (error) {
      const falha = error instanceof AppError ? error : new AppError('Não foi possível selecionar a foto. Tente novamente ou salve sem foto.', 'foto/falha');
      if (montado.current) setCampos(atual => ({ ...atual, fotoUri: falha.message }));
    } finally { bloqueio.current = false; if (montado.current) setSelecionandoFoto(false); }
  }
  async function salvar() {
    if (bloqueio.current) return;
    bloqueio.current = true; setSalvando(true); limparErros();
    try {
      await veiculoController.salvar(user?.uid, { marca: marca?.label, modelo: modelo?.label, ano: ano?.ano, placa, fotoUri });
      if (montado.current) navigation.goBack();
    } catch (error) { if (montado.current) { if (error.campos) setCampos(error.campos); else setErro(error.message); } }
    finally { bloqueio.current = false; if (montado.current) setSalvando(false); }
  }
  const ocupado = salvando || selecionandoFoto;
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <View pointerEvents={ocupado ? 'none' : 'auto'} style={styles.fields}>
              <Select label="Marca" value={marca?.value} options={opcoes.marcas} onSelect={selecionarMarca} placeholder="Selecione a marca" loading={carregando.marcas} error={erroFipe.marcas || campos.marca} />
              {erroFipe.marcas ? <Button title="Recarregar marcas" variant="outline" onPress={() => setTentativa(atual => ({ ...atual, marcas: atual.marcas + 1 }))} /> : null}
              <Select label="Modelo" value={modelo?.value} options={opcoes.modelos} onSelect={selecionarModelo} placeholder={marca ? 'Selecione o modelo' : 'Selecione a marca primeiro'} loading={carregando.modelos} error={erroFipe.modelos || campos.modelo} />
              {erroFipe.modelos ? <Button title="Recarregar modelos" variant="outline" onPress={() => setTentativa(atual => ({ ...atual, modelos: atual.modelos + 1 }))} /> : null}
              <Select label="Ano" value={ano?.value} options={opcoes.anos} onSelect={item => { setAno(item); limparErros(); }} placeholder={modelo ? 'Selecione o ano' : 'Selecione o modelo primeiro'} loading={carregando.anos} error={erroFipe.anos || campos.ano} />
              {erroFipe.anos ? <Button title="Recarregar anos" variant="outline" onPress={() => setTentativa(atual => ({ ...atual, anos: atual.anos + 1 }))} /> : null}
              <Input label="Placa" value={placa} onChangeText={texto => { setPlaca(formatarPlaca(texto)); setCampos(atual => ({ ...atual, placa: undefined })); }} error={campos.placa} placeholder="ABC1234 ou ABC1D23" />
            </View>
            {fotoUri ? <Image source={{ uri: fotoUri }} accessibilityLabel="Foto selecionada do veículo" style={styles.photo} /> : null}
            <Button title={fotoUri ? 'Trocar foto' : 'Adicionar foto (opcional)'} variant="outline" loading={selecionandoFoto} disabled={salvando} onPress={escolherFoto} />
            {fotoUri ? <Button title="Retirar foto" variant="outline" disabled={ocupado} onPress={() => { setFotoUri(''); setCampos(atual => ({ ...atual, fotoUri: undefined })); }} /> : null}
            {campos.fotoUri ? <Text accessibilityRole="alert" style={styles.error}>{campos.fotoUri}</Text> : null}
            {erro ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text> : null}
            <Button title="Salvar veículo" loading={salvando} disabled={selecionandoFoto || Object.values(carregando).some(Boolean)} onPress={salvar} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, content: { flexGrow: 1, padding: spacing.lg, alignItems: 'center' },
  form: { width: '100%', maxWidth: 600, gap: spacing.md }, fields: { gap: spacing.md },
  photo: { width: 160, height: 160, borderRadius: radii.md, alignSelf: 'center', backgroundColor: colors.border }, error: { color: colors.danger, fontSize: 14 },
});
