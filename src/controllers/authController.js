import * as service from '../services/authService';
import { validarEmail, validarSenha, validarTelefone, validarNome } from '../utils/validators';
import AppError from '../utils/AppError';

export async function entrar(email, senha) {
  if (!validarEmail(email)) throw new AppError('Informe um e-mail válido.', 'validacao/email');
  if (!validarSenha(senha)) throw new AppError('A senha deve ter pelo menos 6 caracteres.', 'validacao/senha');
  return service.entrar(email.trim().toLowerCase(), senha);
}

export async function cadastrar(dados = {}) {
  const { nome, telefone, email, senha } = dados || {};
  if (!validarNome(nome)) throw new AppError('Informe um nome com pelo menos 3 caracteres.', 'validacao/nome');
  if (!validarTelefone(telefone)) throw new AppError('Informe um telefone com DDD e 10 ou 11 dígitos.', 'validacao/telefone');
  if (!validarEmail(email)) throw new AppError('Informe um e-mail válido.', 'validacao/email');
  if (!validarSenha(senha)) throw new AppError('A senha deve ter pelo menos 6 caracteres.', 'validacao/senha');
  return service.cadastrar({ nome: nome.trim(), telefone: telefone.replace(/\D/g, ''), email: email.trim().toLowerCase(), senha });
}

export function sair() { return service.sair(); }
export function observarSessao(callback) { return service.observarSessao(callback); }
