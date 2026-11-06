import AppError from './AppError.js';

function falha(mensagem) {
  return new AppError(mensagem, 'agendamento/horario-invalido');
}

export function horaParaMinutos(hora) {
  if (typeof hora !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    throw falha('Informe uma hora válida no formato HH:mm.');
  }
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
}

export function minutosParaHora(minutos) {
  if (!Number.isInteger(minutos) || minutos < 0 || minutos >= 24 * 60) {
    throw falha('O horário deve estar dentro do mesmo dia.');
  }
  return String(Math.floor(minutos / 60)).padStart(2, '0') + ':' + String(minutos % 60).padStart(2, '0');
}

export function calcularHoraFim(horaInicio, duracaoMin) {
  if (!Number.isInteger(duracaoMin) || duracaoMin <= 0) {
    throw falha('Informe uma duração válida em minutos.');
  }
  return minutosParaHora(horaParaMinutos(horaInicio) + duracaoMin);
}

function dataLocal(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw falha('Informe uma data válida no formato YYYY-MM-DD.');
  }
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(0);
  data.setFullYear(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);
  if (ano < 1 || data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    throw falha('Informe uma data válida no formato YYYY-MM-DD.');
  }
  return data;
}

export function getHorariosDisponiveis({ data, duracaoMin, horario, agendamentos, passoMin = 30, agora }) {
  const dia = dataLocal(data);
  if (!Number.isInteger(duracaoMin) || duracaoMin <= 0 || !Number.isInteger(passoMin) || passoMin <= 0) {
    throw falha('A duração e o intervalo dos horários devem ser minutos inteiros maiores que zero.');
  }
  const dias = horario?.diasFuncionamento;
  if (!Array.isArray(dias) || !dias.every(item => Number.isInteger(item) && item >= 0 && item <= 6)) {
    throw falha('Os dias de funcionamento são inválidos.');
  }
  const abertura = horaParaMinutos(horario?.abertura);
  const fechamento = horaParaMinutos(horario?.fechamento);
  if (fechamento <= abertura) throw falha('O fechamento deve ser posterior à abertura.');
  if (!Array.isArray(agendamentos)) throw falha('Não foi possível conferir os agendamentos do dia.');
  if (agora !== undefined && (!(agora instanceof Date) || Number.isNaN(agora.getTime()))) {
    throw falha('A data e hora atuais são inválidas.');
  }
  if (!dias.includes(dia.getDay())) return [];
  const ocupados = agendamentos.filter(item => item.status === 'pendente' || item.status === 'confirmado')
    .map(item => {
      const inicio = horaParaMinutos(item.horaInicio), fim = horaParaMinutos(item.horaFim);
      if (fim <= inicio) throw falha('Há um agendamento com intervalo de horário inválido.');
      return { inicio, fim };
    });
  const hoje = agora && dia.getFullYear() === agora.getFullYear() && dia.getMonth() === agora.getMonth() && dia.getDate() === agora.getDate();
  const horarios = [];
  for (let inicio = abertura; inicio + duracaoMin <= fechamento; inicio += passoMin) {
    const fim = inicio + duracaoMin;
    if (ocupados.some(item => inicio < item.fim && fim > item.inicio)) continue;
    if (hoje) {
      const instante = new Date(dia);
      instante.setHours(Math.floor(inicio / 60), inicio % 60, 0, 0);
      if (instante < agora) continue;
    }
    horarios.push(minutosParaHora(inicio));
  }
  return horarios;
}
