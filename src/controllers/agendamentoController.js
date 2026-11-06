import * as service from '../services/agendamentoService';
import { validarHora } from '../utils/validators';
import AppError from '../utils/AppError';

function chaveValida(valor) {
  return typeof valor === 'string' && !!valor.trim() && !/[.#$\[\]\/\u0000-\u001f\u007f]/.test(valor);
}

function devolverErro(erro) {
  const campo = {
    'validacao/vehicleId': 'vehicleId', 'veiculo/nao-encontrado': 'vehicleId',
    'validacao/data': 'data', 'validacao/horaInicio': 'horaInicio',
    'agendamento/horario-indisponivel': 'horaInicio',
  }[erro.code];
  if (campo) erro.campos = { [campo]: erro.message };
  throw erro;
}

export async function horariosDisponiveis(data, servicoId) {
  try { return await service.listarHorariosDisponiveis({ data, servicoId }); }
  catch (erro) { devolverErro(erro); }
}

export async function agendar(userId, dados) {
  const origem = dados ?? {};
  const campos = {};
  if (!chaveValida(origem.vehicleId)) campos.vehicleId = 'Selecione um veículo da sua garagem.';
  if (typeof origem.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(origem.data)) campos.data = 'Selecione uma data válida.';
  if (!validarHora(origem.horaInicio)) campos.horaInicio = 'Selecione um horário válido.';
  if (Object.keys(campos).length) {
    const erro = new AppError('Revise os campos destacados.', 'validacao/formulario');
    erro.campos = campos; throw erro;
  }
  try { return await service.agendar({ userId, vehicleId: origem.vehicleId, servicoId: origem.servicoId, data: origem.data, horaInicio: origem.horaInicio }); }
  catch (erro) { devolverErro(erro); }
}

export function meusAgendamentos(userId) { return service.listarDoUsuario(userId); }
export function proximo(userId) { return service.proximo(userId); }
export function cancelar(userId, id) { return service.cancelar({ userId, id }); }
