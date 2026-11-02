import AppError from '../utils/AppError';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros';

async function consultar(caminho, campo) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(BASE_URL + caminho, { signal: abort.signal, headers: { Accept: 'application/json' } });
    if (response.status === 429) throw new AppError('O limite de consultas da FIPE foi atingido. Tente novamente mais tarde.', 'fipe/limite');
    if (!response.ok) throw new AppError('A FIPE está indisponível no momento. Tente novamente.', 'fipe/indisponivel');
    const json = await response.json();
    const lista = campo ? json?.[campo] : json;
    if (!Array.isArray(lista) || !lista.every(item => item && typeof item.nome === 'string' && ['string', 'number'].includes(typeof item.codigo))) {
      throw new AppError('A FIPE retornou dados em um formato inesperado. Tente novamente.', 'fipe/resposta-invalida');
    }
    return lista;
  } catch (erro) {
    if (erro instanceof AppError) throw erro;
    if (erro instanceof SyntaxError) throw new AppError('A FIPE retornou uma resposta inválida. Tente novamente.', 'fipe/resposta-invalida');
    throw new AppError(erro?.name === 'AbortError' ? 'A consulta à FIPE demorou demais. Verifique sua conexão e tente novamente.' : 'Não foi possível conectar à FIPE. Verifique sua internet e tente novamente.', 'fipe/conexao');
  } finally { clearTimeout(timeout); }
}

export function listarMarcas() { return consultar('/marcas'); }
export function listarModelos(codigoMarca) { return consultar('/marcas/' + encodeURIComponent(codigoMarca) + '/modelos', 'modelos'); }
export function listarAnos(codigoMarca, codigoModelo) { return consultar('/marcas/' + encodeURIComponent(codigoMarca) + '/modelos/' + encodeURIComponent(codigoModelo) + '/anos'); }
