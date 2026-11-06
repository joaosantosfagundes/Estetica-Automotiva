import * as agendamentoRepository from '../repositories/agendamentoRepository';
import * as servicoRepository from '../repositories/servicoRepository';
import * as usuarioRepository from '../repositories/usuarioRepository';
import * as veiculoRepository from '../repositories/veiculoRepository';
import { STATUS } from '../entities/Agendamento';
import AppError from '../utils/AppError';

const transicoes = {
  [STATUS.PENDENTE]: [STATUS.CONFIRMADO, STATUS.CANCELADO],
  [STATUS.CONFIRMADO]: [STATUS.CONCLUIDO, STATUS.CANCELADO],
};

function traduzirErro(erro) {
  if (erro instanceof AppError) return erro;
  const codigo = erro?.code;
  if (['PERMISSION_DENIED', 'permission_denied', 'database/permission-denied'].includes(codigo)) {
    return new AppError('Sem permissão para acessar a agenda. Confira seu perfil e as regras do banco.', codigo);
  }
  if (['NETWORK_ERROR', 'auth/network-request-failed', 'unavailable', 'database/disconnected'].includes(codigo)
    || /offline|network|disconnected/i.test(erro?.message || '')) {
    return new AppError('Sem conexão. Verifique sua internet e tente novamente.', codigo);
  }
  return new AppError('Não foi possível concluir a operação com a agenda. Tente novamente.', codigo);
}

function conferirId(id) {
  if (typeof id !== 'string' || !id.trim() || /[.#$\[\]\/\u0000-\u001f\u007f]/.test(id)) {
    throw new AppError('O agendamento informado é inválido.', 'agendamento/id-invalido');
  }
  return id.trim();
}

function conferirData(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new AppError('Informe uma data válida no formato YYYY-MM-DD.', 'validacao/data');
  }
  const [ano, mes, dia] = data.split('-').map(Number);
  const local = new Date(0);
  local.setFullYear(ano, mes - 1, dia);
  local.setHours(12, 0, 0, 0);
  if (ano < 1 || local.getFullYear() !== ano || local.getMonth() !== mes - 1 || local.getDate() !== dia) {
    throw new AppError('Informe uma data válida no formato YYYY-MM-DD.', 'validacao/data');
  }
}

export async function listarDoDia(data) {
  try {
    conferirData(data);
    const agendamentos = await agendamentoRepository.listarPorData(data);
    // Reutiliza as consultas quando o mesmo cliente, veículo ou serviço aparece no dia.
    const servicos = new Map();
    const clientes = new Map();
    const veiculos = new Map();
    const carregar = (cache, chave, buscar) => {
      if (!chave) return Promise.resolve(null);
      if (!cache.has(chave)) cache.set(chave, buscar());
      return cache.get(chave);
    };
    const lista = await Promise.all(agendamentos.map(async agendamento => {
      const [servico, cliente, listaVeiculos] = await Promise.all([
        carregar(servicos, agendamento.serviceId, () => servicoRepository.buscarPorId(agendamento.serviceId)),
        carregar(clientes, agendamento.userId, () => usuarioRepository.lerPerfil(agendamento.userId)),
        carregar(veiculos, agendamento.userId, () => veiculoRepository.listarPorUsuario(agendamento.userId)),
      ]);
      const veiculo = listaVeiculos?.find(item => item.id === agendamento.vehicleId);
      return {
        ...agendamento,
        servico: servico ? { nome: servico.nome, duracaoMin: servico.duracaoMin, preco: servico.preco } : null,
        cliente: cliente ? { nome: cliente.nome, telefone: cliente.telefone } : null,
        veiculo: veiculo ? { marca: veiculo.marca, modelo: veiculo.modelo, placa: veiculo.placa } : null,
      };
    }));
    return lista.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio) || a.id.localeCompare(b.id));
  } catch (erro) { throw traduzirErro(erro); }
}

export async function alterarStatus(id, novoStatus) {
  try {
    const chave = conferirId(id);
    if (!Object.values(STATUS).includes(novoStatus)) {
      throw new AppError('Informe um status válido para o agendamento.', 'validacao/status');
    }
    const agendamento = await agendamentoRepository.buscarPorId(chave);
    if (!agendamento) {
      throw new AppError('Agendamento não encontrado. Atualize a agenda e tente novamente.', 'agendamento/nao-encontrado');
    }
    if (!transicoes[agendamento.status]?.includes(novoStatus)) {
      throw new AppError('Não é possível alterar este agendamento para o status escolhido. Atualize a agenda.', 'agendamento/transicao-invalida');
    }
    await agendamentoRepository.atualizarStatus(chave, novoStatus);
    return { ...agendamento, status: novoStatus };
  } catch (erro) { throw traduzirErro(erro); }
}
