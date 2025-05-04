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
    // Escrever logs em um arquivo separado para depuração
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logFile = path.join(logDir, `mcp-mock-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, `${new Date().toISOString()} - ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}\n`);
    } catch (e) {
      // Ignorar erros de escrita no arquivo
    }
  };
  
  silentLog('Criando versão mock do SDK para compatibilidade');
  
  // Classe mock do McpServer
  class MockMcpServer {
    private requestHandlers: Map<any, Function> = new Map();
    private options: any;
    private transport: any;
    private tools: Map<string, {schema: any, handler: Function, options?: any}> = new Map();
    private eventHandlers: Map<string, Function[]> = new Map();
    
    constructor(options?: any) {
      this.options = options || {};
      silentLog('Inicializando MockMcpServer com opções:', JSON.stringify(options));
    }
    
    tool(name: string, schema: any, handler: any, options?: any) {
      silentLog(`Registrando ferramenta ${name}`);
      this.tools.set(name, {schema, handler, options});
      return this;
    }
    
    start() {
      silentLog('Iniciando servidor mock');
      this.emit('start', {});
      return Promise.resolve(this);
    }
    
    stop() {
      silentLog('Parando servidor mock');
      this.emit('close', {});
      return Promise.resolve();
    }

    connect(transport: any) {
      this.transport = transport;
      silentLog('Conectando servidor mock ao transporte');
      
      // Configurar o transporte para processar mensagens
      if (transport && typeof transport.setMessageHandler === 'function') {
        transport.setMessageHandler((message: any) => {
          silentLog('Recebida mensagem no transporte:', message);
          this.processMessage(message);
        });
      }
      
      this.emit('connection', {transportType: 'stdio'});
      return Promise.resolve(this);
    }
    
    setRequestHandler(schema: any, handler: Function) {
      silentLog('Registrando handler para esquema:', JSON.stringify(schema));
      this.requestHandlers.set(schema, handler);
      return this;
    }
    
    // Adicionar suporte a eventos
    on(event: string, handler: Function) {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event)?.push(handler);
      return this;
    }
    
    emit(event: string, data: any) {
      const handlers = this.eventHandlers.get(event) || [];
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          silentLog(`Erro ao executar handler para evento ${event}:`, error);
        }
      }
    }
    
    // Processar mensagens recebidas
    processMessage(message: any) {
      try {
        if (message && message.method === 'call_tool' && message.params) {
          const toolName = message.params.name;
          const toolInfo = this.tools.get(toolName);
          
          if (toolInfo) {
            silentLog(`Chamando ferramenta ${toolName}`);
            const result = toolInfo.handler(message.params.params);
            
            // Responder com o resultado
            if (this.transport && typeof this.transport.send === 'function') {
              this.transport.send({
                jsonrpc: '2.0',
                id: message.id,
                result: result
              });
            }
          } else {
            silentLog(`Ferramenta ${toolName} não encontrada`);
            // Responder com erro
            if (this.transport && typeof this.transport.send === 'function') {
              this.transport.send({
                jsonrpc: '2.0',
                id: message.id,
                error: {
                  code: -32601,
                  message: `Ferramenta ${toolName} não encontrada`
                }
              });
            }
          }
        }
      } catch (error) {
        silentLog('Erro ao processar mensagem:', error);
      }
    }
  }

  // Classe mock do StdioServerTransport
  class MockStdioServerTransport {
    private onMessage: ((message: any) => void) | null = null;
    private eventHandlers: Map<string, Function[]> = new Map();
    
    constructor() {
      silentLog('Inicializando MockStdioServerTransport');
      
      // Configurar leitura de stdin
      process.stdin.on('data', (data) => {
        try {
          const text = data.toString('utf8').trim();
          silentLog('Recebido dado em stdin:', text);
          
          if (text.startsWith('{') && text.includes('"jsonrpc":')) {
            try {
              const message = JSON.parse(text);
              silentLog('Mensagem JSON-RPC recebida:', message);
              if (this.onMessage) {
                this.onMessage(message);
              }
              this.emit('message', message);
            } catch (parseError) {
              silentLog('Erro ao analisar mensagem JSON:', parseError);
            }
          }
        } catch (error) {
          silentLog('Erro ao processar dados de stdin:', error);
        }
      });
      
      // Emitir evento de conexão
      setTimeout(() => {
        this.emit('connection', {transportType: 'stdio'});
      }, 100);
    }
    
    // Métodos adicionais para simular o comportamento do transporte
    setMessageHandler(handler: (message: any) => void) {
      this.onMessage = handler;
      return this;
    }
    
    // Enviar mensagem para stdout
    send(message: any) {
      const json = JSON.stringify(message);
      silentLog('Enviando mensagem para stdout:', json);
      process.stdout.write(json + '\n');
      return this;
    }
    
    // Adicionar suporte a eventos
    on(event: string, handler: Function) {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event)?.push(handler);
      return this;
    }
    
    emit(event: string, data: any) {
      const handlers = this.eventHandlers.get(event) || [];
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          silentLog(`Erro ao executar handler para evento ${event}:`, error);
        }
      }
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
  // Verificar a versão do Node.js
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  
  // Para Node.js v23 ou superior, usar diretamente a implementação mock
  // devido a problemas conhecidos de compatibilidade
  if (majorVersion >= 23) {
    console.warn(`Detectada versão do Node.js ${nodeVersion}. Usando implementação mock para garantir compatibilidade.`);
    return createMockSdk();
  }
  
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
