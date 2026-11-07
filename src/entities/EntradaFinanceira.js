export const VALOR_MAXIMO_CENTAVOS = 999999999;

export function valorCentavosValido(valor) {
  return Number.isSafeInteger(valor) && valor >= 0 && valor <= VALOR_MAXIMO_CENTAVOS;
}

export function montarEntradaFinanceira(id, dados) {
  const { valorCentavos, recebidoEm, servicoNome } = dados ?? {};
  if (!valorCentavosValido(valorCentavos) || !Number.isSafeInteger(recebidoEm) || recebidoEm <= 0) return null;

  return { id, valorCentavos, recebidoEm, servicoNome: servicoNome || 'Serviço sem nome' };
}
