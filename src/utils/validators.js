export function validarEmail(valor) {
  return typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

export function validarSenha(valor) {
  return typeof valor === 'string' && valor.length >= 6;
}

export function validarTelefone(valor) {
  if (typeof valor !== 'string') return false;
  return /^\d{10,11}$/.test(valor.replace(/\D/g, ''));
}

export function validarNome(valor) {
  return typeof valor === 'string' && valor.trim().length >= 3;
}

export function validarPlaca(valor) {
  if (typeof valor !== 'string') return false;
  return /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(valor.replace(/-/g, '').toUpperCase());
}
