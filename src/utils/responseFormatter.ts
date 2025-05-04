import { BigboostResponseWithStatus } from '../types/errorTypes';

/**
 * Formata a resposta da API Bigboost para o formato MCP
 */
export function formatResponse<T>(response: BigboostResponseWithStatus<T>): { type: 'text', text: string } {
  // Converte a resposta para o formato esperado pelo MCP
  return {
    type: 'text',
    text: JSON.stringify(response, null, 2)
  };
}
