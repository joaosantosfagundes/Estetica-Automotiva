import * as repository from '../repositories/configuracaoRepository';
import { montarConfiguracao } from '../entities/Configuracao';
import { validarHora } from '../utils/validators';
import AppError from '../utils/AppError';

function traduzirErro(erro) {
  if (erro instanceof AppError) return erro;
  const codigo = erro?.code;
  if (['PERMISSION_DENIED', 'permission_denied', 'database/permission-denied'].includes(codigo)) {
    return new AppError('Sem permissão para acessar o horário de funcionamento. Confira seu perfil e as regras do banco.', codigo);
  }
  if (['NETWORK_ERROR', 'auth/network-request-failed', 'unavailable', 'database/disconnected'].includes(codigo)
    || /offline|network|disconnected/i.test(erro?.message || '')) {
    return new AppError('Sem conexão. Verifique sua internet e tente novamente.', codigo);
  }
  return new AppError('Não foi possível concluir a operação com o horário de funcionamento. Tente novamente.', codigo);
}

export async function obter() {
  try { return montarConfiguracao(await repository.buscar()); }
  catch (erro) { throw traduzirErro(erro); }
}

export async function salvar(dados) {
  try {
    const origem = dados ?? {};
    if (!validarHora(origem.abertura)) throw new AppError('Informe a abertura no formato HH:mm, entre 00:00 e 23:59.', 'validacao/abertura');
    if (!validarHora(origem.fechamento)) throw new AppError('Informe o fechamento no formato HH:mm, entre 00:00 e 23:59.', 'validacao/fechamento');
    const minutos = hora => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
    if (minutos(origem.fechamento) <= minutos(origem.abertura)) {
      throw new AppError('O fechamento deve ser posterior à abertura.', 'validacao/fechamento');
    }
    if (minutos(origem.fechamento) - minutos(origem.abertura) < 60) {
      throw new AppError('O funcionamento deve ter pelo menos 60 minutos.', 'validacao/fechamento');
    }
    const dias = origem.diasFuncionamento;
    if (!Array.isArray(dias) || dias.length === 0) throw new AppError('Selecione pelo menos um dia de funcionamento.', 'validacao/diasFuncionamento');
    if (![...dias].every(dia => Number.isInteger(dia) && dia >= 0 && dia <= 6)) {
      throw new AppError('Os dias de funcionamento devem ser números inteiros entre 0 (domingo) e 6 (sábado).', 'validacao/diasFuncionamento');
    }
    if (new Set(dias).size !== dias.length) throw new AppError('Os dias de funcionamento não podem se repetir.', 'validacao/diasFuncionamento');
    const configuracao = montarConfiguracao({ abertura: origem.abertura, fechamento: origem.fechamento, diasFuncionamento: [...dias].sort((a, b) => a - b) });
    await repository.salvar(configuracao);
    return configuracao;
  } catch (erro) { throw traduzirErro(erro); }
}
