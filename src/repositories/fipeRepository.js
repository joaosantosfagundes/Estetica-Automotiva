import AppError from '../utils/AppError';

const BASE_URL = 'https://fipe.parallelum.com.br/api/v2/cars/brands';

async function consultar(caminho) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(BASE_URL + caminho, { signal: abort.signal, headers: { Accept: 'application/json' } });
    if (response.status === 429) throw new AppError('O limite de consultas da FIPE foi atingido. Tente novamente mais tarde.', 'fipe/limite');
    if (!response.ok) throw new AppError('A FIPE está indisponível no momento. Tente novamente.', 'fipe/indisponivel');
    const lista = await response.json();
    if (!Array.isArray(lista) || !lista.every(item => typeof item?.name === 'string' && ['string', 'number'].includes(typeof item.code))) {
      throw new AppError('A FIPE retornou dados em um formato inesperado. Tente novamente.', 'fipe/resposta-invalida');
    }
    return lista.map(({ code, name }) => ({ codigo: code, nome: name }));
  } catch (erro) {
    if (erro instanceof AppError) throw erro;
    if (erro instanceof SyntaxError) throw new AppError('A FIPE retornou uma resposta inválida. Tente novamente.', 'fipe/resposta-invalida');
    throw new AppError(erro?.name === 'AbortError' ? 'A consulta à FIPE demorou demais. Verifique sua conexão e tente novamente.' : 'Não foi possível conectar à FIPE. Verifique sua internet e tente novamente.', 'fipe/conexao');
  } finally { clearTimeout(timeout); }
}

export function listarMarcas() {
  return consultar('');
}

export function listarModelos(codigoMarca) {
  return consultar(`/${encodeURIComponent(codigoMarca)}/models`);
}

export function listarAnos(codigoMarca, codigoModelo) {
  return consultar(`/${encodeURIComponent(codigoMarca)}/models/${encodeURIComponent(codigoModelo)}/years`);
}
