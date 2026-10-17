import * as repository from '../repositories/usuarioRepository';
import { montarUsuario, ROLES } from '../entities/Usuario';
import AppError from '../utils/AppError';

const mensagens = {
  'auth/email-already-in-use': 'Este e-mail já está em uso.',
  'auth/weak-password': 'A senha é muito fraca. Use pelo menos 6 caracteres.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/user-disabled': 'Esta conta está desativada.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet e tente novamente.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  'auth/operation-not-allowed': 'O acesso por e-mail e senha não está habilitado.',
  'auth/requires-recent-login': 'Entre novamente para concluir esta operação.',
  'auth/user-token-expired': 'Sua sessão expirou. Entre novamente.',
  'auth/invalid-user-token': 'Sua sessão expirou. Entre novamente.',
  'PERMISSION_DENIED': 'Sem permissão para acessar o perfil. Confira as regras do banco.',
  'permission_denied': 'Sem permissão para acessar o perfil. Confira as regras do banco.',
  'database/permission-denied': 'Sem permissão para acessar o perfil. Confira as regras do banco.',
  'NETWORK_ERROR': 'Sem conexão. Verifique sua internet e tente novamente.',
  'unavailable': 'O serviço está indisponível. Tente novamente.',
};

export function traduzirErro(erro) {
  if (erro instanceof AppError) return erro;
  return new AppError(mensagens[erro?.code] || 'Não foi possível concluir a operação. Tente novamente.', erro?.code);
}

let cadastroPendente = null;

async function carregarUsuario(conta) {
  const perfil = await repository.lerPerfil(conta.uid);
  if (!perfil) throw new AppError('Seu perfil não foi encontrado. Confira o cadastro no banco de dados.', 'auth/perfil-ausente');
  return montarUsuario(conta.uid, { ...perfil, email: conta.email || perfil.email });
}

export async function cadastrar({ nome, telefone, email, senha }) {
  if (cadastroPendente) throw new AppError('Aguarde o cadastro em andamento.', 'auth/cadastro-em-andamento');
  let concluir;
  cadastroPendente = new Promise(resolve => { concluir = resolve; });
  let conta;
  let perfilSalvo = false;
  try {
    conta = await repository.criarConta(email, senha);
    const perfil = { nome, telefone, email, role: ROLES.CLIENTE };
    await repository.gravarPerfil(conta.uid, perfil);
    perfilSalvo = true;
    return montarUsuario(conta.uid, perfil);
  } catch (erro) {
    if (conta && !perfilSalvo) {
      try { await repository.excluirConta(conta); }
      catch {
        try { await repository.sair(); } catch { /* O observador mantém o acesso bloqueado sem perfil. */ }
        throw new AppError('O perfil não foi salvo e não foi possível desfazer a criação da conta. Confira a conta no Authentication antes de tentar novamente.', 'auth/cadastro-incompleto');
      }
    }
    throw traduzirErro(erro);
  } finally {
    cadastroPendente = null;
    concluir();
  }
}

export async function entrar(email, senha) {
  try { await repository.entrar(email, senha); }
  catch (erro) { throw traduzirErro(erro); }
}

export async function sair() {
  try { await repository.sair(); }
  catch (erro) { throw traduzirErro(erro); }
}

// O segundo argumento do callback é um AppError quando o perfil não carrega.
export function observarSessao(callback) {
  let ativo = true;
  let versao = 0;
  try {
    const cancelar = repository.observarSessao(async conta => {
      const atual = ++versao;
      const pendente = cadastroPendente;
      if (pendente) await pendente;
      if (!ativo || atual !== versao) return;
      try {
        const usuario = conta ? await carregarUsuario(conta) : null;
        if (ativo && atual === versao) callback(usuario, null);
      } catch (erro) {
        if (ativo && atual === versao) callback(null, traduzirErro(erro));
      }
    }, erro => {
      ++versao;
      if (ativo) callback(null, traduzirErro(erro));
    });
    return () => { ativo = false; ++versao; cancelar(); };
  } catch (erro) { throw traduzirErro(erro); }
}
