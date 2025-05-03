import { createMcpServer, McpServer } from './mcpServer';
import { registerTools } from './tools';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Cria e configura o servidor MCP
 * @returns Instância configurada do servidor MCP
 */
export function createServer(): McpServer {
  // Criar instância do servidor MCP
  const server = createMcpServer({
    description: 'Servidor MCP para integração com a API Bigboost da Bigdatacorp'
  });

  // Registrar as ferramentas disponíveis
  registerTools(server);

  // Iniciar o servidor
  server.start().then(() => {
    console.log('Servidor MCP iniciado com sucesso');
  }).catch((error) => {
    console.error('Erro ao iniciar o servidor MCP:', error);
    process.exit(1);
  });

  return server;
}
