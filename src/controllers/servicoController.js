import * as service from '../services/servicoService';
import { validarNome, validarPreco, validarDuracao } from '../utils/validators';
import AppError from '../utils/AppError';

export function listar(opcoes) { return service.listar(opcoes); }
export function buscar(id) { return service.buscar(id); }
export function alternarAtivo(id, ativo) { return service.alternarAtivo(id, ativo); }

export async function salvar(dados, id) {
  const origem = dados ?? {};
  const campos = {};
  if (!validarNome(origem.nome)) campos.nome = 'Informe um nome com pelo menos 3 caracteres.';
  if (!validarPreco(origem.preco)) campos.preco = 'Informe um preço maior que zero, usando vírgula ou ponto nos centavos.';
  if (!validarDuracao(origem.duracaoMin)) campos.duracaoMin = 'A duração deve ser um número inteiro entre 15 e 600 minutos.';
  if (Object.keys(campos).length) {
    const erro = new AppError('Revise os campos destacados.', 'validacao/formulario');
    erro.campos = campos;
    throw erro;
  }
  const preco = typeof origem.preco === 'number' ? origem.preco : Number(origem.preco.trim().replace(',', '.'));
  return service.salvar({ ...origem, nome: origem.nome.trim(), preco, duracaoMin: Number(origem.duracaoMin) }, id);
}
