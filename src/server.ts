import { createMcpServer, McpServer, StdioServerTransport } from './mcpServer';
import { registerTools } from './tools';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Cria e configura o servidor MCP
 * @returns Objeto com servidor e função de limpeza
 */
export function createServer() {
  // Criar instância do servidor MCP
  const server = createMcpServer({
    description: 'Servidor MCP para integração com a API Bigboost da Bigdatacorp'
  });

  // Registrar as ferramentas disponíveis
  registerTools(server);

  // Função para limpar recursos quando o servidor for encerrado
  const cleanup = async () => {
    console.log('Limpando recursos do servidor MCP');
  };

  return { server, cleanup };
}

/**
 * Inicia o servidor MCP com o transporte especificado
 * @param server Servidor MCP
 * @param transport Transporte a ser utilizado (opcional, padrão: StdioServerTransport)
 */
export async function startServer(server: McpServer, transport?: any) {
  // Criar transporte padrão se não for fornecido
  const serverTransport = transport || new StdioServerTransport();
  
  try {
    // Conectar o servidor ao transporte
    await server.connect(serverTransport);
    console.log('Servidor MCP iniciado com sucesso');
  } catch (error) {
    console.error('Erro ao iniciar o servidor MCP:', error);
    process.exit(1);
  }
}
