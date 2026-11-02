export function montarVeiculo(id, dados = {}) {
  const origem = dados ?? {};
  const ano = Number(origem.ano);
  return {
    id,
    userId: typeof origem.userId === 'string' ? origem.userId : '',
    marca: typeof origem.marca === 'string' ? origem.marca : '',
    modelo: typeof origem.modelo === 'string' ? origem.modelo : '',
    ano: Number.isFinite(ano) ? ano : 0,
    placa: typeof origem.placa === 'string' ? origem.placa : '',
    fotoUri: typeof origem.fotoUri === 'string' ? origem.fotoUri : '',
  };
}
