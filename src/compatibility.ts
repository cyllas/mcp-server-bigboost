/**
 * Este arquivo fornece compatibilidade entre diferentes versões do Node.js
 * e o SDK do Model Context Protocol
 */

import * as path from 'path';
import * as fs from 'fs';

/**
 * Função para resolver o caminho do módulo SDK
 * @returns Caminho para o módulo SDK
 */
export function resolveSdkPath(): string {
  try {
    return require.resolve('@modelcontextprotocol/sdk');
  } catch (error) {
    // Fallback para o caminho relativo
    const possiblePaths = [
      path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk'),
      path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs/index.js'),
      path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/esm/index.js')
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    
    return possiblePaths[0]; // Retorna o primeiro caminho como fallback
  }
}

/**
 * Mock do SDK do MCP para casos onde não é possível carregar o SDK original
 * Esta implementação evita enviar logs para o console, que podem interferir na comunicação MCP
 */
function createMockSdk() {
  // Usar um logger silencioso para não interferir na comunicação MCP
  const silentLog = (...args: any[]) => {
    // Descomente para depuração
    // fs.appendFileSync('mcp-mock-debug.log', `${new Date().toISOString()} - ${args.join(' ')}\n`);
  };
  
  silentLog('Criando versão mock do SDK para compatibilidade');
  
  // Classe mock do McpServer
  class MockMcpServer {
    private requestHandlers: Map<any, Function> = new Map();
    private options: any;
    private transport: any;
    
    constructor(options?: any) {
      this.options = options || {};
      silentLog('Inicializando MockMcpServer com opções:', JSON.stringify(options));
    }
    
    tool(name: string, schema: any, handler: any, options?: any) {
      silentLog(`Registrando ferramenta ${name}`);
      return this;
    }
    
    start() {
      silentLog('Iniciando servidor mock');
      return Promise.resolve(this);
    }
    
    stop() {
      silentLog('Parando servidor mock');
      return Promise.resolve();
    }

    connect(transport: any) {
      this.transport = transport;
      silentLog('Conectando servidor mock ao transporte');
      return Promise.resolve(this);
    }
    
    setRequestHandler(schema: any, handler: Function) {
      silentLog('Registrando handler para esquema:', JSON.stringify(schema));
      this.requestHandlers.set(schema, handler);
      return this;
    }
  }

  // Classe mock do StdioServerTransport
  class MockStdioServerTransport {
    private onMessage: ((message: any) => void) | null = null;
    
    constructor() {
      silentLog('Inicializando MockStdioServerTransport');
    }
    
    // Métodos adicionais para simular o comportamento do transporte
    setMessageHandler(handler: (message: any) => void) {
      this.onMessage = handler;
      return this;
    }
  }
  
  return {
    McpServer: MockMcpServer,
    StdioServerTransport: MockStdioServerTransport
  };
}

/**
 * Função para carregar o SDK de forma compatível
 * @returns Módulo SDK carregado
 */
export function loadSdk(): any {
  try {
    // Tenta importar diretamente
    return require('@modelcontextprotocol/sdk');
  } catch (error) {
    console.warn('Erro ao carregar o SDK diretamente, tentando método alternativo:', (error as Error).message);
    
    try {
      // Verifica se o diretório do SDK existe
      const sdkDir = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk');
      if (!fs.existsSync(sdkDir)) {
        console.warn('Diretório do SDK não encontrado, criando versão mock');
        return createMockSdk();
      }
      
      // Tenta carregar o módulo pelo caminho resolvido
      const sdkPath = resolveSdkPath();
      try {
        return require(sdkPath);
      } catch (innerError) {
        console.warn('Erro ao carregar pelo caminho resolvido:', (innerError as Error).message);
        
        // Tenta importar diretamente os arquivos de distribuição
        try {
          const cjsPath = path.resolve(sdkDir, 'dist/cjs/index.js');
          if (fs.existsSync(cjsPath)) {
            return require(cjsPath);
          }
          
          const esmPath = path.resolve(sdkDir, 'dist/esm/index.js');
          if (fs.existsSync(esmPath)) {
            return require(esmPath);
          }
        } catch (distError) {
          console.warn('Erro ao carregar arquivos de distribuição:', (distError as Error).message);
        }
        
        // Se todas as tentativas falharem, cria uma versão mock
        console.warn('Todas as tentativas de carregamento falharam, usando versão mock');
        return createMockSdk();
      }
    } catch (finalError) {
      console.error('Falha crítica ao tentar carregar o SDK:', (finalError as Error).message);
      return createMockSdk();
    }
  }
}
