/**
 * Classe que representa o servidor MCP para integração com a API Bigboost
 * Exporta a classe Server do SDK do MCP
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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
