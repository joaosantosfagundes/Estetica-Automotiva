export const ROLES = Object.freeze({ CLIENTE: 'cliente', ADMIN: 'admin' });

export function montarUsuario(uid, dados = {}) {
  return {
    uid,
    nome: dados.nome ?? '',
    telefone: dados.telefone ?? '',
    email: dados.email ?? '',
    role: dados.role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.CLIENTE,
  };
}
