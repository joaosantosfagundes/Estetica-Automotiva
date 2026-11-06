import assert from 'node:assert/strict';
import { horaParaMinutos, minutosParaHora, calcularHoraFim, getHorariosDisponiveis } from '../src/utils/schedule.js';

const horario = { abertura: '08:00', fechamento: '12:00', diasFuncionamento: [1, 2, 3, 4, 5, 6] };
const base = { data: '2026-11-09', duracaoMin: 60, horario, agendamentos: [] };
const livres = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
const calcular = dados => getHorariosDisponiveis({ ...base, ...dados });
const reserva = (horaInicio, horaFim, status = 'pendente') => ({ horaInicio, horaFim, status });

assert.equal(horaParaMinutos('09:30'), 570);
assert.equal(horaParaMinutos('00:00'), 0);
assert.equal(horaParaMinutos('23:59'), 1439);
assert.equal(minutosParaHora(570), '09:30');
assert.equal(minutosParaHora(0), '00:00');
assert.equal(minutosParaHora(1439), '23:59');
assert.equal(calcularHoraFim('09:45', 90), '11:15');
assert.equal(calcularHoraFim('08:00', 240), '12:00');
assert.deepEqual(calcular({ data: '2026-11-08' }), []); // Domingo fechado.
assert.deepEqual(calcular({}), livres);
assert.deepEqual(calcular({ duracaoMin: 240 }), ['08:00']);
assert.deepEqual(calcular({ duracaoMin: 241 }), []);
assert.deepEqual(calcular({ agendamentos: [reserva('09:00', '10:00')] }), ['08:00', '10:00', '10:30', '11:00']);
assert.deepEqual(calcular({ agendamentos: [reserva('09:00', '10:00', 'confirmado')] }), ['08:00', '10:00', '10:30', '11:00']);
assert.deepEqual(calcular({ agendamentos: [reserva('09:00', '10:00', 'cancelado'), reserva('10:00', '11:00', 'concluido')] }), livres);
assert.deepEqual(calcular({ agendamentos: [reserva('08:15', '08:45')] }), ['09:00', '09:30', '10:00', '10:30', '11:00']);
assert.deepEqual(calcular({ passoMin: 60 }), ['08:00', '09:00', '10:00', '11:00']);
assert.deepEqual(calcular({ agora: new Date(2026, 10, 9, 9, 10) }), ['09:30', '10:00', '10:30', '11:00']);
assert.deepEqual(calcular({ agora: new Date(2026, 10, 9, 9, 0) }), ['09:00', '09:30', '10:00', '10:30', '11:00']);
assert.deepEqual(calcular({ agora: new Date(2026, 10, 9, 9, 0, 1) }), ['09:30', '10:00', '10:30', '11:00']);
assert.deepEqual(calcular({ agora: new Date(2026, 10, 9, 13, 0) }), []);
assert.deepEqual(calcular({ agora: new Date(2026, 10, 8, 13, 0) }), livres);
assert.deepEqual(calcular({ data: '2028-02-29', horario: { ...horario, diasFuncionamento: [2] } }), livres);
const frozen = { ...base, horario: Object.freeze({ ...horario, diasFuncionamento: Object.freeze([...horario.diasFuncionamento]) }),
  agendamentos: Object.freeze([Object.freeze(reserva('09:00', '10:00'))]), agora: new Date(2026, 10, 9, 8, 0) };
const antes = JSON.stringify(frozen);
getHorariosDisponiveis(Object.freeze(frozen));
assert.equal(JSON.stringify(frozen), antes);
for (const hora of ['24:00', '09:60', '9:00', '', null]) assert.throws(() => horaParaMinutos(hora));
for (const minutos of [-1, 1440, 1.5, NaN, '60']) assert.throws(() => minutosParaHora(minutos));
for (const data of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '0000-01-01', '09/11/2026']) assert.throws(() => calcular({ data }));
for (const passoMin of [0, -30, 2.5, NaN]) assert.throws(() => calcular({ passoMin }));
for (const duracaoMin of [0, -60, 2.5, Infinity]) assert.throws(() => calcular({ duracaoMin }));
assert.throws(() => calcularHoraFim('23:30', 60));
assert.throws(() => calcular({ agendamentos: [reserva('10:00', '09:00')] }));
console.log('OK');
