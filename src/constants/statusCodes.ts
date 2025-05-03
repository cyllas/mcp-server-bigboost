/**
 * Categorias de códigos de status da API Bigboost
 */
export enum StatusCodeCategory {
  INPUT_DATA = 'INPUT_DATA',           // -100 a -999: Problemas nos dados de entrada
  LOGIN = 'LOGIN',                     // -1000 a -1199: Problemas de login
  INTERNAL = 'INTERNAL',               // -1200 a -1999: Problemas internos nas APIs ou datasets
  ON_DEMAND = 'ON_DEMAND',             // -2000 a -2999: Consultas on-demand
  MONITORING = 'MONITORING'            // -3000 em diante: Problemas na API de Monitoramento ou Chamadas Assíncronas
}

/**
 * Determina a categoria de um código de status
 * @param code Código de status
 * @returns Categoria do código de status
 */
export function getStatusCodeCategory(code: number): StatusCodeCategory {
  if (code >= -999 && code <= -100) {
    return StatusCodeCategory.INPUT_DATA;
  } else if (code >= -1199 && code <= -1000) {
    return StatusCodeCategory.LOGIN;
  } else if (code >= -1999 && code <= -1200) {
    return StatusCodeCategory.INTERNAL;
  } else if (code >= -2999 && code <= -2000) {
    return StatusCodeCategory.ON_DEMAND;
  } else if (code <= -3000) {
    return StatusCodeCategory.MONITORING;
  }
  
  // Para códigos não mapeados, assumimos que são problemas internos
  return StatusCodeCategory.INTERNAL;
}

/**
 * Verifica se um código de status representa um erro
 * @param code Código de status
 * @returns true se o código representa um erro
 */
export function isErrorStatusCode(code: number): boolean {
  return code < 0;
}
