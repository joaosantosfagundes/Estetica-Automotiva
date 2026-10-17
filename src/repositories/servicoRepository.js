import { get, push, ref, set, update } from 'firebase/database';
import { db } from '../config/firebase';
import { montarServico } from '../entities/Servico';

export async function listar() {
  const snapshot = await get(ref(db, 'services'));
  const servicos = [];
  snapshot.forEach(filho => {
    servicos.push(montarServico(filho.key, filho.val()));
  });
  return servicos;
}

export async function buscarPorId(id) {
  const snapshot = await get(ref(db, 'services/' + id));
  return snapshot.exists() ? montarServico(snapshot.key, snapshot.val()) : null;
}

export async function criar(dados) {
  const novo = push(ref(db, 'services'));
  await set(novo, dados);
  return montarServico(novo.key, dados);
}

export function atualizar(id, dados) {
  return update(ref(db, 'services/' + id), dados);
}
