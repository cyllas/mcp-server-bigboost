import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      // Adicione propriedades personalizadas aqui, se necessário
    }

    interface Response {
      // Adicione propriedades personalizadas aqui, se necessário
    }
  }
}
