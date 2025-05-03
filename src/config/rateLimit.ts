/**
 * Configuração de limite de requisições para a API Bigboost
 * Limite: 5000 requisições a cada 5 minutos por IP
 */
export const rateLimitConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutos em milissegundos
  maxRequests: 5000, // Máximo de requisições no período
  // Recomendação: distribuir homogeneamente as requisições
  requestsPerSecond: Math.floor(5000 / (5 * 60)), // ~16 requisições por segundo
};
