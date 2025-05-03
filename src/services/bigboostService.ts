import axios, { AxiosInstance } from 'axios';
import { authConfig } from '../config/auth';
import { BigboostResponseWithStatus } from '../types/errorTypes';
import { processStatusCodes } from '../utils/errorHandler';
import { validateTags } from '../utils/tagValidator';
import { rateLimiter } from '../utils/rateLimiter';
import { RateLimitExceededError, DatasetUnavailableError } from '../utils/errorHandler';

const API_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

/**
 * Serviço para comunicação com a API Bigboost
 */
export class BigboostService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'AccessToken': authConfig.accessToken,
        'TokenId': authConfig.tokenId
      },
      timeout: 30000 // Timeout de 30 segundos para consultas mais pesadas
    });
  }

  /**
   * Executa uma consulta na API Bigboost
   * @param endpoint Endpoint da API (ex: '/pessoas')
   * @param payload Dados da consulta
   * @param tags Tags de chamada (opcional)
   * @returns Resultado da consulta
   */
  async executeQuery<T = any>(
    endpoint: string, 
    payload: any, 
    tags?: Record<string, string>
  ): Promise<BigboostResponseWithStatus<T>> {
    // Verifica limite de requisições
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new RateLimitExceededError(waitTime);
    }

    // Prepara o payload com as tags, se fornecidas
    const requestPayload = { ...payload };
    if (tags) {
      requestPayload.Tags = validateTags(tags);
    }

    try {
      const response = await this.client.post<BigboostResponseWithStatus<T>>(endpoint, requestPayload);
      const data = response.data;
      
      // Verifica se algum dataset está indisponível
      if (data.status && data.status.some(s => s.message === 'DATASET UNAVAILABLE')) {
        const unavailableDataset = data.status.find(s => s.message === 'DATASET UNAVAILABLE');
        throw new DatasetUnavailableError(unavailableDataset?.dataset || 'desconhecido');
      }
      
      // Processa os códigos de status e lança erro se necessário
      if (data.status) {
        processStatusCodes(data.status);
      }
      
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Verifica se é um erro de limite de requisições
        if (error.response?.status === 429) {
          throw new RateLimitExceededError(60000); // 1 minuto como padrão
        }
        
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.message;
        throw new Error(`Erro na consulta (${statusCode}): ${message}`);
      }
      throw error;
    }
  }
}

// Instância singleton do serviço
export const bigboostService = new BigboostService();
