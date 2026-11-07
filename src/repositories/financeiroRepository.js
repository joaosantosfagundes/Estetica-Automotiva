import { endBefore, get, orderByChild, query, ref, serverTimestamp, startAt, update } from 'firebase/database';
import { db } from '../config/firebase';
import { STATUS } from '../entities/Agendamento';
import { montarEntradaFinanceira } from '../entities/EntradaFinanceira';

export function registrarConclusao(id, { valorCentavos, servicoNome }) {
  return update(ref(db), {
    [`bookings/${id}/status`]: STATUS.CONCLUIDO,
    [`receipts/${id}`]: { valorCentavos, servicoNome, recebidoEm: serverTimestamp() },
  });
}

export async function listarPorPeriodo(inicio, fim) {
  const consulta = query(ref(db, 'receipts'), orderByChild('recebidoEm'), startAt(inicio), endBefore(fim));
  const snapshot = await get(consulta);
  const entradas = [];
  snapshot.forEach(item => {
    const entrada = montarEntradaFinanceira(item.key, item.val());
    if (entrada) entradas.push(entrada);
  });
  return entradas.reverse();
}
