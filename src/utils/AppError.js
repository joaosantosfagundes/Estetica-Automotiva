export default class AppError extends Error {
  constructor(message = 'Não foi possível concluir a operação.', code) {
    super(message);
    this.name = 'AppError';
    if (code !== undefined) this.code = code;
  }
}
