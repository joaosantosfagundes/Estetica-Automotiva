import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authController from '../controllers/authController';
import AppError from '../utils/AppError';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [estado, setEstado] = useState({ user: null, loading: true, error: null });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    setEstado({ user: null, loading: true, error: null });
    let cancelar;
    try {
      cancelar = authController.observarSessao((user, error) => {
        if (ativo) setEstado({ user, loading: false, error });
      });
    } catch (erro) {
      setEstado({ user: null, loading: false, error: erro instanceof AppError ? erro : new AppError('Não foi possível carregar a sessão.') });
    }
    return () => { ativo = false; cancelar?.(); };
  }, [tentativa]);
  return <AuthContext.Provider value={{ ...estado, tentarNovamente: () => setTentativa(valor => valor + 1) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new AppError('useAuth deve ser usado dentro de AuthProvider.', 'auth/provider-ausente');
  return contexto;
}
