import * as service from '../services/configuracaoService';
import { validarHora } from '../utils/validators';
import AppError from '../utils/AppError';

export function obter() { return service.obter(); }

export async function salvar(dados) {
  const origem = dados ?? {};
  const campos = {};
  if (!validarHora(origem.abertura)) campos.abertura = 'Informe a abertura no formato HH:mm, entre 00:00 e 23:59.';
  if (!validarHora(origem.fechamento)) campos.fechamento = 'Informe o fechamento no formato HH:mm, entre 00:00 e 23:59.';
  const dias = origem.diasFuncionamento;
  if (!Array.isArray(dias) || dias.length === 0) campos.diasFuncionamento = 'Selecione pelo menos um dia de funcionamento.';
  else if (![...dias].every(dia => Number.isInteger(dia) && dia >= 0 && dia <= 6) || new Set(dias).size !== dias.length) {
    campos.diasFuncionamento = 'Selecione dias entre domingo e sábado, sem repetição.';
  }
  if (Object.keys(campos).length) {
    const erro = new AppError('Revise os campos destacados.', 'validacao/formulario');
    erro.campos = campos;
    throw erro;
  }
  try {
    return await service.salvar({ abertura: origem.abertura, fechamento: origem.fechamento, diasFuncionamento: [...dias] });
  } catch (erro) {
    const campo = { 'validacao/abertura': 'abertura', 'validacao/fechamento': 'fechamento', 'validacao/diasFuncionamento': 'diasFuncionamento' }[erro.code];
    if (campo) erro.campos = { [campo]: erro.message };
    throw erro;
  }
}
