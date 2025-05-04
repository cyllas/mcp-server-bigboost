/**
 * Classe que representa o servidor MCP para integração com a API Bigboost
 * Exporta a classe Server do SDK do MCP
 */
import { loadSdk } from './compatibility';

// Carregar o SDK de forma compatível
const sdk = loadSdk();

// Extrair componentes do SDK
const { McpServer: Server, StdioServerTransport } = sdk;

// Definir esquemas para compatibilidade
const CallToolRequestSchema = { type: 'object', properties: {} };
const ListToolsRequestSchema = { type: 'object', properties: {} };

export { Server as McpServer, StdioServerTransport, CallToolRequestSchema, ListToolsRequestSchema };

/**
 * Cria uma instância do servidor MCP
 * @param options Opções de configuração do servidor
 * @returns Instância do servidor MCP
 */
export function createMcpServer(options?: any) {
  // Cria uma nova instância do servidor MCP
  const server = new Server(
    {
      name: "mcp-server-bigboost",
      version: "1.0.0",
      description: "Servidor MCP para integração com a API Bigboost da Bigdatacorp",
      ...options
    },
    {
      capabilities: {
        tools: {
          call: true,
          list: true
        },
      },
    }
  );
  
  return server;
}
