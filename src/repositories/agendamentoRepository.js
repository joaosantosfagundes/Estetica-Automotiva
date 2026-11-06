import { equalTo, get, orderByChild, push, query, ref, set } from 'firebase/database';
import { db } from '../config/firebase';
import { montarAgendamento } from '../entities/Agendamento';

function montarLista(snapshot) {
  const agendamentos = [];
  snapshot.forEach(filho => { agendamentos.push(montarAgendamento(filho.key, filho.val())); });
  return agendamentos;
}

export async function criar(dados) {
  const novo = push(ref(db, 'bookings'));
  await set(novo, dados);
  return montarAgendamento(novo.key, dados);
}

export async function listarPorUsuario(userId) {
  const consulta = query(ref(db, 'bookings'), orderByChild('userId'), equalTo(userId));
  return montarLista(await get(consulta));
}

export async function listarPorData(data) {
  const consulta = query(ref(db, 'bookings'), orderByChild('data'), equalTo(data));
  return montarLista(await get(consulta));
}

// Leitura direta reservada ao admin pelas regras; permite conferir a transição de status.
export async function buscarPorId(id) {
  const snapshot = await get(ref(db, 'bookings/' + id));
  return snapshot.exists() ? montarAgendamento(snapshot.key, snapshot.val()) : null;
}

export function atualizarStatus(id, status) {
  return set(ref(db, 'bookings/' + id + '/status'), status);
}
