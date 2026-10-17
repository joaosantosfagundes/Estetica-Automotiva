import * as repository from '../repositories/servicoRepository';
import { montarServico } from '../entities/Servico';
import AppError from '../utils/AppError';

function traduzirErro(erro) {
  if (erro instanceof AppError) return erro;
  const codigo = erro?.code;
  if (['PERMISSION_DENIED', 'permission_denied', 'database/permission-denied'].includes(codigo)) {
    return new AppError('Sem permissão para acessar os serviços. Confira seu perfil e as regras do banco.', codigo);
  }
  if (['NETWORK_ERROR', 'auth/network-request-failed', 'unavailable', 'database/disconnected'].includes(codigo)
    || /offline|network|disconnected/i.test(erro?.message || '')) {
    return new AppError('Sem conexão. Verifique sua internet e tente novamente.', codigo);
  }
  return new AppError('Não foi possível concluir a operação com os serviços. Tente novamente.', codigo);
}

function conferirId(id) {
  if (typeof id !== 'string' || !id.trim() || /[.#$\[\]\/\u0000-\u001f\u007f]/.test(id)) {
    throw new AppError('O serviço informado é inválido.', 'servico/id-invalido');
  }
  return id.trim();
}

function normalizarNome(nome) {
  return nome.trim().replace(/\s+/g, ' ');
}

async function obterExistente(id) {
  const servico = await repository.buscarPorId(id);
  if (!servico) throw new AppError('Serviço não encontrado. Atualize a lista e tente novamente.', 'servico/nao-encontrado');
  return servico;
}

export async function listar(opcoes = {}) {
  try {
    const { apenasAtivos = false } = opcoes ?? {};
    const servicos = await repository.listar();
    return servicos.filter(servico => !apenasAtivos || servico.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } catch (erro) { throw traduzirErro(erro); }
}

export async function buscar(id) {
  try { return await obterExistente(conferirId(id)); }
  catch (erro) { throw traduzirErro(erro); }
}

export async function salvar(dados, id) {
  try {
    const origem = dados ?? {};
    if (typeof origem.nome !== 'string' || normalizarNome(origem.nome).length < 3) {
      throw new AppError('Informe um nome com pelo menos 3 caracteres.', 'validacao/nome');
    }
    if (typeof origem.preco !== 'number' || !Number.isFinite(origem.preco) || origem.preco <= 0) {
      throw new AppError('Informe um preço maior que zero.', 'validacao/preco');
    }
    if (!Number.isInteger(origem.duracaoMin) || origem.duracaoMin < 15 || origem.duracaoMin > 600) {
      throw new AppError('A duração deve ser um número inteiro entre 15 e 600 minutos.', 'validacao/duracaoMin');
    }
    if (origem.descricao !== undefined && typeof origem.descricao !== 'string') {
      throw new AppError('Informe uma descrição válida.', 'validacao/descricao');
    }
    if (origem.ativo !== undefined && typeof origem.ativo !== 'boolean') {
      throw new AppError('Informe se o serviço está ativo.', 'validacao/ativo');
    }
    const chave = id === undefined ? undefined : conferirId(id);
    const existente = chave ? await obterExistente(chave) : null;
    const nome = normalizarNome(origem.nome);
    const todos = await repository.listar();
    if (todos.some(servico => servico.id !== chave && normalizarNome(servico.nome).toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))) {
      throw new AppError('Já existe um serviço com este nome, mesmo que esteja inativo.', 'servico/nome-repetido');
    }
    const perfil = {
      nome,
      descricao: (origem.descricao ?? '').trim(),
      preco: origem.preco,
      duracaoMin: origem.duracaoMin,
      ativo: origem.ativo ?? existente?.ativo ?? true,
    };
    if (!chave) return await repository.criar(perfil);
    await repository.atualizar(chave, perfil);
    return montarServico(chave, perfil);
  } catch (erro) { throw traduzirErro(erro); }
}

export async function alternarAtivo(id, ativo) {
  try {
    const chave = conferirId(id);
    if (typeof ativo !== 'boolean') throw new AppError('Informe se o serviço está ativo.', 'validacao/ativo');
    const existente = await obterExistente(chave);
    await repository.atualizar(chave, { ativo });
    return { ...existente, ativo };
  } catch (erro) { throw traduzirErro(erro); }
}
