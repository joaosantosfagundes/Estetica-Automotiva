import * as repository from '../repositories/fipeRepository';
import AppError from '../utils/AppError';

function conferirCodigo(codigo, campo) {
  if (!['string', 'number'].includes(typeof codigo) || !/^[0-9]+$/.test(String(codigo))) {
    throw new AppError('Selecione ' + campo + ' antes de continuar.', 'validacao/fipe');
  }
}

function opcoes(lista) {
  return lista.map(item => ({ value: String(item.codigo), label: item.nome }));
}

async function executar(operacao) {
  try { return await operacao(); }
  catch (erro) { throw erro instanceof AppError ? erro : new AppError('Não foi possível consultar a FIPE. Verifique sua conexão e tente novamente.', 'fipe/conexao'); }
}

export function listarMarcas() { return executar(async () => opcoes(await repository.listarMarcas())); }
export function listarModelos(codigoMarca) {
  return executar(async () => { conferirCodigo(codigoMarca, 'a marca'); return opcoes(await repository.listarModelos(codigoMarca)); });
}
export function listarAnos(codigoMarca, codigoModelo) {
  return executar(async () => {
    conferirCodigo(codigoMarca, 'a marca');
    conferirCodigo(codigoModelo, 'o modelo');
    const limite = new Date().getFullYear() + 1;
    return opcoes(await repository.listarAnos(codigoMarca, codigoModelo))
      .map(item => ({ ...item, ano: /^[0-9]{4}-[0-9]+$/.test(item.value) ? Number(item.value.split('-')[0]) : 0 }))
      .filter(item => item.ano >= 1950 && item.ano <= limite);
  });
}
