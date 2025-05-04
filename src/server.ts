import { createMcpServer, McpServer, StdioServerTransport } from './mcpServer';
import { registerTools } from './tools';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { logger, info, error, logConnection, logConnectionClosed, logError, LogLevel } from './utils/logger';

// Carregar variáveis de ambiente
dotenv.config();

// Mapa para rastrear conexões ativas
const activeConnections = new Map<string, any>();

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

  // Interceptar logs do console para evitar interferência na comunicação MCP
  interceptConsoleLogs();

  // Função para limpar recursos quando o servidor for encerrado
  const cleanup = async () => {
    info('Server', 'Limpando recursos do servidor MCP');
    
    // Fechar todas as conexões ativas
    for (const [connectionId, connection] of activeConnections.entries()) {
      try {
        logConnectionClosed(connectionId, 'Servidor encerrado');
      } catch (err) {
        logError(connectionId, err, 'Erro ao fechar conexão durante limpeza');
      }
    }
    
    activeConnections.clear();
  };

  return { server, cleanup };
}

/**
 * Inicia o servidor MCP com o transporte especificado
 * @param server Servidor MCP
 * @param transport Transporte a ser utilizado (opcional, padrão: StdioServerTransport)
 */
export async function startServer(server: any, transport?: any) {
  // Criar transporte padrão se não for fornecido
  const serverTransport = transport || new StdioServerTransport();
  
  // Gerar ID único para esta instância do servidor
  const serverId = uuidv4();
  info('Server', `Iniciando servidor MCP com ID: ${serverId}`);
  
  try {
    // Adicionar handlers para eventos de conexão
    addConnectionHandlers(server, serverTransport);
    
    // Conectar o servidor ao transporte
    await server.connect(serverTransport);
    info('Server', 'Servidor MCP iniciado com sucesso');
  } catch (err) {
    error('Server', 'Erro ao iniciar o servidor MCP', err);
    process.exit(1);
  }
}

/**
 * Adiciona handlers para eventos de conexão
 * @param server Servidor MCP
 * @param transport Transporte utilizado
 */
function addConnectionHandlers(server: any, transport: any) {
  // Interceptar eventos de conexão se disponíveis
  if (transport.on) {
    // Gerar ID único para cada conexão
    transport.on('connection', (connection: any, params: any) => {
      const connectionId = uuidv4();
      activeConnections.set(connectionId, connection);
      
      // Registrar informações da conexão
      logConnection(connectionId, params?.transportType || 'unknown', params);
      
      info('Connection', `Nova conexão estabelecida: ${connectionId}`, {
        transportType: params?.transportType,
        params
      });
      
      // Monitorar desconexão
      if (connection.on) {
        connection.on('close', () => {
          logConnectionClosed(connectionId, 'Conexão fechada pelo cliente');
          activeConnections.delete(connectionId);
        });
        
        connection.on('error', (err: any) => {
          logError(connectionId, err, 'Erro na conexão');
        });
      }
    });
  }
  
  // Interceptar eventos do servidor
  if (server.on) {
    server.on('request', (request: any) => {
      info('Server', 'Requisição recebida', { 
        method: request?.method,
        params: request?.params 
      });
    });
    
    server.on('error', (err: any) => {
      error('Server', 'Erro no servidor MCP', err);
    });
  }
}

/**
 * Intercepta logs do console para evitar interferência na comunicação MCP
 */
function interceptConsoleLogs() {
  // Salvar referências originais
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  // Substituir com versões que usam o logger
  console.log = (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    logger.log(LogLevel.INFO, 'Console', message);
  };
  
  console.info = (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    logger.log(LogLevel.INFO, 'Console', message);
  };
  
  console.warn = (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    logger.log(LogLevel.WARN, 'Console', message);
  };
  
  console.error = (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    logger.log(LogLevel.ERROR, 'Console', message);
  };
}
