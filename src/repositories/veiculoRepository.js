import { equalTo, get, orderByChild, push, query, ref, remove, set } from 'firebase/database';
import { db } from '../config/firebase';
import { montarVeiculo } from '../entities/Veiculo';

export async function listarPorUsuario(userId) {
  const consulta = query(ref(db, 'vehicles'), orderByChild('userId'), equalTo(userId));
  const snapshot = await get(consulta);
  const veiculos = [];
  snapshot.forEach(filho => { veiculos.push(montarVeiculo(filho.key, filho.val())); });
  return veiculos;
}

export async function buscarPorId(id, userId) {
  // As regras permitem a consulta filtrada, mas não a leitura direta de vehicles/ID.
  return (await listarPorUsuario(userId)).find(veiculo => veiculo.id === id) ?? null;
}

export async function criar(dados) {
  const novo = push(ref(db, 'vehicles'));
  await set(novo, dados);
  return montarVeiculo(novo.key, dados);
}

export function remover(id) { return remove(ref(db, 'vehicles/' + id)); }
