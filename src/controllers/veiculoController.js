import * as service from '../services/veiculoService';
import * as fipeService from '../services/fipeService';
import { validarPlaca } from '../utils/validators';
import AppError from '../utils/AppError';

export function listar(userId) { return service.listar(userId); }
export function buscar(userId, id) { return service.buscar(userId, id); }
export function remover(userId, id) { return service.remover(userId, id); }
export function listarMarcas() { return fipeService.listarMarcas(); }
export function listarModelos(codigoMarca) { return fipeService.listarModelos(codigoMarca); }
export function listarAnos(codigoMarca, codigoModelo) { return fipeService.listarAnos(codigoMarca, codigoModelo); }

export async function salvar(userId, dados) {
  const origem = dados ?? {};
  const campos = {};
  if (typeof origem.marca !== 'string' || !origem.marca.trim()) campos.marca = 'Selecione a marca do veículo.';
  if (typeof origem.modelo !== 'string' || !origem.modelo.trim()) campos.modelo = 'Selecione o modelo do veículo.';
  const ano = typeof origem.ano === 'number' || (typeof origem.ano === 'string' && /^[0-9]{4}$/.test(origem.ano)) ? Number(origem.ano) : NaN;
  if (!Number.isInteger(ano) || ano < 1950 || ano > new Date().getFullYear() + 1) campos.ano = 'Selecione um ano entre 1950 e o próximo ano.';
  if (typeof origem.placa !== 'string' || !validarPlaca(origem.placa.trim())) campos.placa = 'Informe uma placa válida, como ABC1234 ou ABC1D23.';
  if (Object.keys(campos).length) {
    const erro = new AppError('Revise os campos destacados.', 'validacao/formulario'); erro.campos = campos; throw erro;
  }
  try { return await service.salvar(userId, { marca: origem.marca, modelo: origem.modelo, ano, placa: origem.placa, fotoUri: origem.fotoUri }); }
  catch (erro) {
    const campo = { 'validacao/marca': 'marca', 'validacao/modelo': 'modelo', 'validacao/ano': 'ano', 'validacao/placa': 'placa', 'validacao/fotoUri': 'fotoUri' }[erro.code];
    if (campo) erro.campos = { [campo]: erro.message };
    throw erro;
  }
}
