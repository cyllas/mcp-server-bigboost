import { StatusCodeCategory, getStatusCodeCategory, isErrorStatusCode } from '../constants/statusCodes';
import { BigboostErrorData, BigboostStatus } from '../types/errorTypes';

/**
 * Classe para erros específicos da API Bigboost
 */
export class BigboostError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly category: StatusCodeCategory
  ) {
    super(message);
    this.name = 'BigboostError';
  }
}

/**
 * Erro para limite de requisições excedido
 */
export class RateLimitExceededError extends Error {
  constructor(waitTime: number) {
    super(`Limite de requisições excedido. Tente novamente em ${Math.ceil(waitTime / 1000)} segundos.`);
    this.name = 'RateLimitExceededError';
  }
}

/**
 * Erro para dataset não disponível
 */
export class DatasetUnavailableError extends Error {
  constructor(dataset: string) {
    super(`Dataset "${dataset}" não está disponível para o seu usuário.`);
    this.name = 'DatasetUnavailableError';
  }
}

/**
 * Processa os status da resposta e lança erro se necessário
 * @param status Lista de status da resposta
 * @throws BigboostError se algum status representar um erro
 */
export function processStatusCodes(status: BigboostStatus[]): void {
  if (!status || status.length === 0) {
    return;
  }

  // Procura por códigos de erro na lista de status
  const errorStatus = status.find(s => isErrorStatusCode(s.code));
  if (errorStatus) {
    const category = getStatusCodeCategory(errorStatus.code);
    throw new BigboostError(errorStatus.code, errorStatus.message, category);
  }
}

/**
 * Formata um erro para o formato de resposta do MCP
 * @param error Erro a ser formatado
 * @returns Objeto formatado para resposta do MCP
 */
export function formatErrorResponse(error: unknown): { type: 'text', text: string } {
  // Prepara o objeto de erro para o formato esperado pelo MCP
  let errorObj: any = {
    error: {
      message: 'Erro desconhecido'
    }
  };

  if (error instanceof BigboostError) {
    errorObj.error = {
      code: error.code,
      message: error.message,
      category: error.category
    };
  } else if (error instanceof RateLimitExceededError || error instanceof DatasetUnavailableError) {
    errorObj.error = {
      message: error.message
    };
  } else if (error instanceof Error) {
    errorObj.error = {
      message: error.message
    };
  }

  // Retorna no formato esperado pelo MCP
  return {
    type: 'text',
    text: JSON.stringify(errorObj, null, 2)
  };
}
