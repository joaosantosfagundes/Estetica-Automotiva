export const HORARIO_PADRAO = {
  abertura: '08:00',
  fechamento: '18:00',
  diasFuncionamento: [1, 2, 3, 4, 5, 6],
};

export function montarConfiguracao(dados) {
  const origem = dados ?? {};
  return {
    abertura: origem.abertura ?? HORARIO_PADRAO.abertura,
    fechamento: origem.fechamento ?? HORARIO_PADRAO.fechamento,
    diasFuncionamento: [...(Array.isArray(origem.diasFuncionamento) ? origem.diasFuncionamento : HORARIO_PADRAO.diasFuncionamento)],
  };
}
