import { rateLimitConfig } from '../config/rateLimit';

/**
 * Classe para controle de limite de requisições
 * Implementa um algoritmo de token bucket para distribuir as requisições homogeneamente
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly refillRate: number; // tokens por milissegundo

  constructor() {
    this.tokens = rateLimitConfig.maxRequests;
    this.lastRefill = Date.now();
    this.refillRate = rateLimitConfig.maxRequests / rateLimitConfig.windowMs;
  }

  /**
   * Verifica se é possível fazer uma requisição
   * @returns true se é possível fazer uma requisição, false caso contrário
   */
  canMakeRequest(): boolean {
    this.refillTokens();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Reabastece os tokens com base no tempo decorrido
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.tokens + tokensToAdd, rateLimitConfig.maxRequests);
      this.lastRefill = now;
    }
  }

  /**
   * Retorna o tempo estimado (em ms) até que uma requisição possa ser feita
   * @returns Tempo estimado em milissegundos
   */
  getWaitTime(): number {
    if (this.canMakeRequest()) {
      return 0;
    }
    
    // Calcula quanto tempo precisamos esperar para ter 1 token
    return Math.ceil((1 - this.tokens) / this.refillRate);
  }
}

// Instância singleton do limitador de requisições
export const rateLimiter = new RateLimiter();
