export const CATEGORIAS = ['Exterior', 'Pintura', 'Interior', 'Proteção', 'Outros'];

export function montarServico(id, dados = {}) {
  const origem = dados ?? {};
  const preco = Number(origem.preco ?? 0);
  const duracaoMin = Number(origem.duracaoMin ?? 0);
  return {
    id,
    nome: typeof origem.nome === 'string' ? origem.nome : '',
    descricao: typeof origem.descricao === 'string' ? origem.descricao : '',
    categoria: CATEGORIAS.includes(origem.categoria) ? origem.categoria : 'Outros',
    preco: Number.isFinite(preco) ? preco : 0,
    duracaoMin: Number.isFinite(duracaoMin) ? duracaoMin : 0,
    ativo: typeof origem.ativo === 'boolean' ? origem.ativo : true,
  };
}
