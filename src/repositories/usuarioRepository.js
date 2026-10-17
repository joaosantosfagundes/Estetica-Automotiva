import { createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import { auth, db } from '../config/firebase';

export async function lerPerfil(uid) {
  const snapshot = await get(ref(db, 'users/' + uid));
  return snapshot.exists() ? snapshot.val() : null;
}

export function gravarPerfil(uid, perfil) {
  return set(ref(db, 'users/' + uid), perfil);
}

export async function criarConta(email, senha) {
  return (await createUserWithEmailAndPassword(auth, email, senha)).user;
}

export async function entrar(email, senha) {
  return (await signInWithEmailAndPassword(auth, email, senha)).user;
}

export function sair() { return signOut(auth); }
export function excluirConta(usuario) { return deleteUser(usuario); }
export function observarSessao(callback, onError) {
  return onAuthStateChanged(auth, callback, onError);
}
