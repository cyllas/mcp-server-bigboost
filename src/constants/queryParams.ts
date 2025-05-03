/**
 * Tipos de parâmetros de consulta da API Bigboost
 */
export enum QueryParamType {
  REQUIRED = 'REQUIRED',           // Obrigatório
  SEMI_REQUIRED = 'SEMI_REQUIRED', // Semi-obrigatório
  OPTIONAL = 'OPTIONAL',           // Opcional
  ALTERNATIVE_KEY = 'ALTERNATIVE_KEY' // Chave alternativa
}

/**
 * Mapeamento de parâmetros de consulta por tipo
 * Será preenchido conforme necessidade de implementação
 */
export const queryParams = {
  [QueryParamType.REQUIRED]: [
    'Datasets',
    'q'
  ],
  [QueryParamType.SEMI_REQUIRED]: [
    // Será preenchido conforme necessidade
  ],
  [QueryParamType.OPTIONAL]: [
    'Limit',
    'dateformat'
  ],
  [QueryParamType.ALTERNATIVE_KEY]: [
    // Será preenchido conforme necessidade
  ]
};
