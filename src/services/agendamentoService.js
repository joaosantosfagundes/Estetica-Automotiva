import * as repository from '../repositories/agendamentoRepository';
import * as servicoRepository from '../repositories/servicoRepository';
import * as configuracaoService from './configuracaoService';
import * as veiculoService from './veiculoService';
import { STATUS, STATUS_ATIVOS } from '../entities/Agendamento';
import { calcularHoraFim, getHorariosDisponiveis } from '../utils/schedule';
import { validarHora } from '../utils/validators';
import AppError from '../utils/AppError';

function traduzirErro(erro) {
  if (erro instanceof AppError) return erro;
  const codigo = erro?.code;
  if (['PERMISSION_DENIED', 'permission_denied', 'database/permission-denied'].includes(codigo)) {
    return new AppError('Sem permissão para acessar os agendamentos. Entre novamente e confira as regras do banco.', codigo);
  }
  if (['NETWORK_ERROR', 'auth/network-request-failed', 'unavailable', 'database/disconnected'].includes(codigo)
    || /offline|network|disconnected/i.test(erro?.message || '')) {
    return new AppError('Sem conexão. Verifique sua internet e tente novamente.', codigo);
  }
  return new AppError('Não foi possível concluir a operação com os agendamentos. Tente novamente.', codigo);
}

function conferirChave(valor, campo) {
  if (typeof valor !== 'string' || !valor.trim() || /[.#$\[\]\/\u0000-\u001f\u007f]/.test(valor)) {
    throw new AppError(campo === 'userId' ? 'Entre novamente para acessar seus agendamentos.' : 'Selecione um registro válido para o agendamento.', 'validacao/' + campo);
  }
  return valor.trim();
}

function dataLocal(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new AppError('Informe uma data válida no formato YYYY-MM-DD.', 'validacao/data');
  }
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(0);
  data.setFullYear(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);
  if (ano < 1 || data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    throw new AppError('Informe uma data válida no formato YYYY-MM-DD.', 'validacao/data');
  }
  return data;
}

function conferirDataFutura(texto, agora) {
  const data = dataLocal(texto);
  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);
  if (data < hoje) throw new AppError('Escolha uma data a partir de hoje.', 'validacao/data');
  return data;
}

function inicioDoAgendamento(item) {
  const inicio = dataLocal(item.data);
  if (!validarHora(item.horaInicio)) {
    throw new AppError('Um agendamento possui horário inválido. Entre em contato com a estética.', 'agendamento/dados-invalidos');
  }
  const [hora, minuto] = item.horaInicio.split(':').map(Number);
  inicio.setHours(hora, minuto, 0, 0);
  return inicio;
}

async function carregarDisponibilidade(data, servicoId) {
  conferirDataFutura(data, new Date());
  const id = conferirChave(servicoId, 'servicoId');
  const servico = await servicoRepository.buscarPorId(id);
  if (!servico || !servico.ativo) throw new AppError('Este serviço não está disponível para agendamento.', 'agendamento/servico-indisponivel');
  const [horario, agendamentos] = await Promise.all([
    configuracaoService.obter(), repository.listarPorData(data),
  ]);
  const agora = new Date();
  conferirDataFutura(data, agora);
  const horarios = getHorariosDisponiveis({ data, duracaoMin: servico.duracaoMin, horario, agendamentos, agora });
  return { servico, horarios };
}

export async function listarHorariosDisponiveis(opcoes) {
  try {
    const { data, servicoId } = opcoes ?? {};
    return (await carregarDisponibilidade(data, servicoId)).horarios;
  }
  catch (erro) { throw traduzirErro(erro); }
}

export async function agendar(dados) {
  try {
    const origem = dados ?? {};
    const userId = conferirChave(origem.userId, 'userId');
    const vehicleId = conferirChave(origem.vehicleId, 'vehicleId');
    const serviceId = conferirChave(origem.servicoId, 'servicoId');
    if (!validarHora(origem.horaInicio)) throw new AppError('Selecione um horário válido.', 'validacao/horaInicio');
    conferirDataFutura(origem.data, new Date());
    await veiculoService.buscar(userId, vehicleId);
    // Reconsulta o banco imediatamente antes da escrita; não reutiliza a lista exibida na tela.
    const { servico, horarios } = await carregarDisponibilidade(origem.data, serviceId);
    if (!horarios.includes(origem.horaInicio)) {
      throw new AppError('Este horário não está mais disponível. Escolha outro horário.', 'agendamento/horario-indisponivel');
    }
    return await repository.criar({
      userId, vehicleId, serviceId, data: origem.data, horaInicio: origem.horaInicio,
      horaFim: calcularHoraFim(origem.horaInicio, servico.duracaoMin),
      status: STATUS.PENDENTE, criadoEm: Date.now(),
    });
  } catch (erro) { throw traduzirErro(erro); }
}

export async function listarDoUsuario(userId) {
  try {
    const uid = conferirChave(userId, 'userId');
    const [agendamentos, veiculos] = await Promise.all([repository.listarPorUsuario(uid), veiculoService.listar(uid)]);
    const servicos = new Map();
    const itens = await Promise.all(agendamentos.map(async item => {
      if (!servicos.has(item.serviceId)) servicos.set(item.serviceId, item.serviceId ? servicoRepository.buscarPorId(item.serviceId) : Promise.resolve(null));
      const servico = await servicos.get(item.serviceId);
      const veiculo = veiculos.find(atual => atual.id === item.vehicleId);
      return {
        ...item,
        servico: servico ? { nome: servico.nome, preco: servico.preco, duracaoMin: servico.duracaoMin } : null,
        veiculo: veiculo ? { marca: veiculo.marca, modelo: veiculo.modelo, placa: veiculo.placa } : null,
      };
    }));
    const agora = new Date();
    const proximos = [], historico = [];
    for (const item of itens) {
      if (STATUS_ATIVOS.includes(item.status) && inicioDoAgendamento(item) > agora) proximos.push(item);
      else historico.push(item);
    }
    const comparar = (a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio) || a.id.localeCompare(b.id);
    proximos.sort(comparar); historico.sort((a, b) => comparar(b, a));
    return { proximos, historico };
  } catch (erro) { throw traduzirErro(erro); }
}

export async function proximo(userId) {
  return (await listarDoUsuario(userId)).proximos[0] ?? null;
}

export async function cancelar(dados) {
  try {
    const { userId, id } = dados ?? {};
    const uid = conferirChave(userId, 'userId');
    const chave = conferirChave(id, 'id');
    const agendamento = (await repository.listarPorUsuario(uid)).find(item => item.id === chave && item.userId === uid);
    if (!agendamento) throw new AppError('Agendamento não encontrado na sua conta.', 'agendamento/nao-encontrado');
    if (!STATUS_ATIVOS.includes(agendamento.status)) throw new AppError('Este agendamento não pode mais ser cancelado.', 'agendamento/cancelamento-invalido');
    if (inicioDoAgendamento(agendamento) <= new Date()) throw new AppError('Não é possível cancelar um agendamento que já começou.', 'agendamento/cancelamento-invalido');
    await repository.atualizarStatus(chave, STATUS.CANCELADO);
    return { ...agendamento, status: STATUS.CANCELADO };
  } catch (erro) { throw traduzirErro(erro); }
}
