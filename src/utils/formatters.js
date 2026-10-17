export function formatarMoeda(valor) {
  const numero = Number(valor);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(Number.isFinite(numero) ? numero : 0);
}

export function formatarTelefone(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '').slice(0, 11);
  if (!digitos) return '';
  if (digitos.length <= 2) return '(' + digitos;
  const numero = digitos.slice(2);
  const corte = digitos.length === 11 ? 5 : 4;
  return '(' + digitos.slice(0, 2) + ') ' + numero.slice(0, corte)
    + (numero.length > corte ? '-' + numero.slice(corte) : '');
}

export function formatarPlaca(texto) {
  const placa = String(texto ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 7);
  return /^[A-Z]{3}\d{4}$/.test(placa) ? placa.slice(0, 3) + '-' + placa.slice(3) : placa;
}

export function formatarData(texto) {
  if (typeof texto !== 'string') return '';
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return '';
  const [, ano, mes, dia] = partes;
  const data = new Date(texto + 'T00:00:00Z');
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== texto) return '';
  return dia + '/' + mes + '/' + ano;
}
