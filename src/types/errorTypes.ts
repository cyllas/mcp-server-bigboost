import { StatusCodeCategory } from '../constants/statusCodes';

/**
 * Interface para erros da API Bigboost
 */
export interface BigboostErrorData {
  code: number;
  message: string;
  category: StatusCodeCategory;
}

/**
 * Interface para status de uma consulta
 */
export interface BigboostStatus {
  code: number;
  message: string;
  dataset?: string;
}

/**
 * Interface para resposta com status
 */
export interface BigboostResponseWithStatus<T = any> {
  result?: T;
  status?: BigboostStatus[];
  error?: BigboostErrorData;
}
