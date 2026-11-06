import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_ULTIMO_VEICULO = '@estetica/ultimo-veiculo';

export async function lerUltimoVeiculo() {
  try {
    const id = await AsyncStorage.getItem(CHAVE_ULTIMO_VEICULO);
    return typeof id === 'string' && id.trim() ? id : null;
  } catch { return null; }
}

export async function salvarUltimoVeiculo(id) {
  try {
    if (typeof id === 'string' && id.trim()) await AsyncStorage.setItem(CHAVE_ULTIMO_VEICULO, id);
  } catch { /* A preferência local não deve impedir o agendamento. */ }
}
