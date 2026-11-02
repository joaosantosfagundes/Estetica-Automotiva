import * as repository from '../repositories/veiculoRepository';
import { validarPlaca } from '../utils/validators';
import AppError from '../utils/AppError';

function traduzirErro(erro) {
  if (erro instanceof AppError) return erro;
  const codigo = erro?.code;
  if (['PERMISSION_DENIED', 'permission_denied', 'database/permission-denied'].includes(codigo)) return new AppError('Sem permissão para acessar os veículos. Entre novamente e confira as regras do banco.', codigo);
  if (['NETWORK_ERROR', 'auth/network-request-failed', 'unavailable', 'database/disconnected'].includes(codigo) || /offline|network|disconnected/i.test(erro?.message || '')) return new AppError('Sem conexão. Verifique sua internet e tente novamente.', codigo);
  return new AppError('Não foi possível concluir a operação com os veículos. Tente novamente.', codigo);
}

function conferirChave(valor, usuario = false) {
  if (typeof valor !== 'string' || !valor.trim() || /[.#$\[\]\/\u0000-\u001f\u007f]/.test(valor)) throw new AppError(usuario ? 'Entre novamente para acessar seus veículos.' : 'O veículo informado é inválido.', usuario ? 'veiculo/usuario-invalido' : 'veiculo/id-invalido');
}

const normalizarPlaca = placa => placa.trim().replace(/-/g, '').toUpperCase();

export async function listar(userId) {
  try { conferirChave(userId, true); return await repository.listarPorUsuario(userId); }
  catch (erro) { throw traduzirErro(erro); }
}

export async function buscar(userId, id) {
  try {
    conferirChave(userId, true); conferirChave(id);
    const veiculo = await repository.buscarPorId(id, userId);
    if (!veiculo || veiculo.userId !== userId) throw new AppError('Veículo não encontrado na sua garagem.', 'veiculo/nao-encontrado');
    return veiculo;
  } catch (erro) { throw traduzirErro(erro); }
}

export async function salvar(userId, dados) {
  try {
    conferirChave(userId, true);
    const origem = dados ?? {};
    if (typeof origem.marca !== 'string' || !origem.marca.trim()) throw new AppError('Selecione a marca do veículo.', 'validacao/marca');
    if (typeof origem.modelo !== 'string' || !origem.modelo.trim()) throw new AppError('Selecione o modelo do veículo.', 'validacao/modelo');
    if (!Number.isInteger(origem.ano) || origem.ano < 1950 || origem.ano > new Date().getFullYear() + 1) throw new AppError('Selecione um ano entre 1950 e o próximo ano.', 'validacao/ano');
    if (typeof origem.placa !== 'string' || !validarPlaca(origem.placa.trim())) throw new AppError('Informe uma placa válida, como ABC1234 ou ABC1D23.', 'validacao/placa');
    if (origem.fotoUri !== undefined && typeof origem.fotoUri !== 'string') throw new AppError('Selecione uma foto válida ou salve sem foto.', 'validacao/fotoUri');
    const placa = normalizarPlaca(origem.placa);
    const existentes = await repository.listarPorUsuario(userId);
    if (existentes.some(veiculo => normalizarPlaca(veiculo.placa) === placa)) throw new AppError('Esta placa já está cadastrada na sua garagem.', 'validacao/placa');
    return await repository.criar({ userId, marca: origem.marca.trim(), modelo: origem.modelo.trim(), ano: origem.ano, placa, fotoUri: origem.fotoUri ?? '' });
  } catch (erro) { throw traduzirErro(erro); }
}

export async function remover(userId, id) {
  try { await buscar(userId, id); await repository.remover(id); }
  catch (erro) { throw traduzirErro(erro); }
}
