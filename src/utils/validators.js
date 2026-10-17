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

export function validarPreco(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor > 0;
  if (typeof valor !== 'string' || !/^\d+(?:[.,]\d+)?$/.test(valor.trim())) return false;
  const numero = Number(valor.trim().replace(',', '.'));
  return Number.isFinite(numero) && numero > 0;
}

export function validarDuracao(valor) {
  if (typeof valor !== 'number' && (typeof valor !== 'string' || !/^\d+$/.test(valor.trim()))) return false;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 15 && numero <= 600;
}
