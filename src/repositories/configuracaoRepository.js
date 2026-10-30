import { get, ref, set } from 'firebase/database';
import { db } from '../config/firebase';

export async function buscar() {
  const snapshot = await get(ref(db, 'settings/horario'));
  return snapshot.exists() ? snapshot.val() : null;
}

export function salvar(dados) {
  return set(ref(db, 'settings/horario'), dados);
}
