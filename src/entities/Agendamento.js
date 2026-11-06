export const STATUS = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  CANCELADO: 'cancelado',
  CONCLUIDO: 'concluido',
};

export const STATUS_ATIVOS = [STATUS.PENDENTE, STATUS.CONFIRMADO];

export const STATUS_ROTULOS = {
  [STATUS.PENDENTE]: 'Pendente',
  [STATUS.CONFIRMADO]: 'Confirmado',
  [STATUS.CANCELADO]: 'Cancelado',
  [STATUS.CONCLUIDO]: 'Concluído',
};

export function montarAgendamento(id, dados = {}) {
  const origem = dados ?? {};
  return {
    id,
    userId: typeof origem.userId === 'string' ? origem.userId : '',
    vehicleId: typeof origem.vehicleId === 'string' ? origem.vehicleId : '',
    serviceId: typeof origem.serviceId === 'string' ? origem.serviceId : '',
    data: typeof origem.data === 'string' ? origem.data : '',
    horaInicio: typeof origem.horaInicio === 'string' ? origem.horaInicio : '',
    horaFim: typeof origem.horaFim === 'string' ? origem.horaFim : '',
    status: typeof origem.status === 'string' ? origem.status : '',
    criadoEm: typeof origem.criadoEm === 'number' && Number.isFinite(origem.criadoEm) ? origem.criadoEm : 0,
  };
}
