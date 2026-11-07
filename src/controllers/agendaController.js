import * as service from '../services/agendaService';
import AppError from '../utils/AppError';
import { STATUS } from '../entities/Agendamento';
import { valorCentavosValido } from '../entities/EntradaFinanceira';

export async function listarDoDia(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const erro = new AppError('Informe uma data válida no formato YYYY-MM-DD.', 'validacao/data');
    erro.campos = { data: erro.message };
    throw erro;
  }
  try { return await service.listarDoDia(data); }
  catch (erro) {
    if (erro.code === 'validacao/data') erro.campos = { data: erro.message };
    throw erro;
  }
}

export async function alterarStatus(id, status, valorRecebido) {
  if (typeof id !== 'string' || !id.trim() || /[.#$\[\]\/\u0000-\u001f\u007f]/.test(id)) {
    throw new AppError('O agendamento informado é inválido.', 'agendamento/id-invalido');
  }
  if (!Object.values(STATUS).includes(status)) {
    const erro = new AppError('Informe um status válido para o agendamento.', 'validacao/status');
    erro.campos = { status: erro.message };
    throw erro;
  }
  if (status !== STATUS.CONCLUIDO) return service.alterarStatus(id.trim(), status);

  const partes = typeof valorRecebido === 'string' && /^(\d+)(?:[.,](\d{1,2}))?$/.exec(valorRecebido.trim());
  const valorCentavos = partes ? Number(partes[1]) * 100 + Number((partes[2] ?? '').padEnd(2, '0')) : NaN;
  if (!valorCentavosValido(valorCentavos)) {
    const erro = new AppError('Informe o valor recebido entre 0 e 9.999.999,99, com até duas casas decimais.', 'financeiro/valor-invalido');
    erro.campos = { valorRecebido: erro.message };
    throw erro;
  }
  return service.alterarStatus(id.trim(), status, valorCentavos);
}
