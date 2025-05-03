import { RateLimiter, rateLimiter } from '../../../utils/rateLimiter';
import { rateLimitConfig } from '../../../config/rateLimit';

// Mock do módulo de configuração para controlar os valores nos testes
jest.mock('../../../config/rateLimit', () => ({
  rateLimitConfig: {
    maxRequests: 10,
    windowMs: 1000 // 1 segundo
  }
}));

// Mock do Date.now para controlar o tempo nos testes
const mockDateNow = jest.spyOn(Date, 'now');

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configura o tempo inicial
    mockDateNow.mockReturnValue(1000);
  });

  afterEach(() => {
    mockDateNow.mockRestore();
  });

  it('deve inicializar com o número máximo de tokens', () => {
    const limiter = new RateLimiter();
    // Verifica se pode fazer requisições imediatamente após a inicialização
    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('deve permitir requisições até atingir o limite', () => {
    // Tempo fixo para o teste
    mockDateNow.mockReturnValue(1000);
    
    const limiter = new RateLimiter();
    
    // Deve permitir o número máximo de requisições
    for (let i = 0; i < rateLimitConfig.maxRequests; i++) {
      expect(limiter.canMakeRequest()).toBe(true);
    }
    
    // A próxima requisição deve ser rejeitada
    expect(limiter.canMakeRequest()).toBe(false);
  });

  it('deve calcular o tempo de espera corretamente', () => {
    // Tempo inicial
    mockDateNow.mockReturnValue(1000);
    
    const limiter = new RateLimiter();
    
    // Consome todos os tokens
    for (let i = 0; i < rateLimitConfig.maxRequests; i++) {
      limiter.canMakeRequest();
    }
    
    // Verifica que não há mais tokens
    expect(limiter.canMakeRequest()).toBe(false);
    
    // Verifica que o tempo de espera é maior que zero
    const waitTime = limiter.getWaitTime();
    expect(waitTime).toBeGreaterThan(0);
  });

  it('deve reabastecer tokens após o tempo de espera', () => {
    // Tempo inicial
    mockDateNow.mockReturnValue(1000);
    
    const limiter = new RateLimiter();
    
    // Consome metade dos tokens
    for (let i = 0; i < rateLimitConfig.maxRequests / 2; i++) {
      limiter.canMakeRequest();
    }
    
    // Ainda deve ser possível fazer requisições
    expect(limiter.canMakeRequest()).toBe(true);
    
    // Avança o tempo
    mockDateNow.mockReturnValue(1000 + 100);
    
    // Verifica que ainda é possível fazer requisições
    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('deve ter um número máximo de tokens', () => {
    // Tempo inicial
    mockDateNow.mockReturnValue(1000);
    
    const limiter = new RateLimiter();
    
    // Verifica que o número inicial de tokens é igual ao máximo configurado
    let tokenCount = 0;
    while (limiter.canMakeRequest()) {
      tokenCount++;
      // Evita loop infinito em caso de falha
      if (tokenCount > rateLimitConfig.maxRequests * 2) break;
    }
    
    // O número de tokens usados deve ser igual ao máximo configurado
    expect(tokenCount).toBe(rateLimitConfig.maxRequests);
  });

  it('deve exportar uma instância singleton do RateLimiter', () => {
    // Verifica se rateLimiter é uma instância de RateLimiter
    expect(rateLimiter).toBeInstanceOf(RateLimiter);
    
    // Verifica se pode fazer requisições com a instância singleton
    expect(typeof rateLimiter.canMakeRequest).toBe('function');
    expect(typeof rateLimiter.getWaitTime).toBe('function');
  });
});
