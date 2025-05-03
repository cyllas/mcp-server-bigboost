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
  if (error instanceof BigboostError) {
    return {
      type: 'text',
      text: JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          category: error.category
        }
      }, null, 2)
    };
  }

  if (error instanceof RateLimitExceededError || error instanceof DatasetUnavailableError) {
    return {
      type: 'text',
      text: JSON.stringify({
        error: {
          message: error.message
        }
      }, null, 2)
    };
  }

  if (error instanceof Error) {
    return {
      type: 'text',
      text: JSON.stringify({
        error: {
          message: error.message
        }
      }, null, 2)
    };
  }

  return {
    type: 'text',
    text: JSON.stringify({
      error: {
        message: 'Erro desconhecido'
      }
    }, null, 2)
  };
}
