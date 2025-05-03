import { McpServer as BaseMcpServer } from '@modelcontextprotocol/sdk';

/**
 * Classe que representa o servidor MCP para integração com a API Bigboost
 * Exporta a classe McpServer do SDK do MCP
 */
export { BaseMcpServer as McpServer };

/**
 * Cria uma instância do servidor MCP
 * @param options Opções de configuração do servidor
 * @returns Instância do servidor MCP
 */
export function createMcpServer(options?: any): BaseMcpServer {
  return new BaseMcpServer(options);
}
