import * as financeiroRepository from '../repositories/financeiroRepository';
import AppError from '../utils/AppError';

export async function listarDoMes(ano, mes) {
  if (!Number.isInteger(ano) || ano < 1000 || ano > 9999 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new AppError('Selecione um mês válido.', 'financeiro/periodo-invalido');
  }

  try {
    const inicio = new Date(ano, mes - 1, 1).getTime();
    const fim = new Date(ano, mes, 1).getTime();
    const entradas = await financeiroRepository.listarPorPeriodo(inicio, fim);
    const totalCentavos = entradas.reduce((total, entrada) => total + entrada.valorCentavos, 0);
    return { entradas, totalCentavos };
  } catch (erro) {
    if (erro instanceof AppError) throw erro;
    const codigo = erro?.code;
    if (['PERMISSION_DENIED', 'permission_denied', 'database/permission-denied'].includes(codigo) || /permission denied/i.test(erro?.message || '')) {
      throw new AppError('Sem permissão para acessar o financeiro. Confira seu perfil e as regras do banco.', codigo);
    }
    if (['NETWORK_ERROR', 'unavailable', 'database/disconnected'].includes(codigo) || /offline|network|disconnected/i.test(erro?.message || '')) {
      throw new AppError('Sem conexão. Verifique sua internet e tente novamente.', codigo);
    }
    throw new AppError('Não foi possível carregar as entradas. Tente novamente.', codigo);
  }
}
