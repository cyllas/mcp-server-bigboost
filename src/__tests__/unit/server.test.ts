import { createServer } from '../../server';
import { createMcpServer, McpServer } from '../../mcpServer';
import { registerTools } from '../../tools';

// Mock das dependências
jest.mock('../../mcpServer', () => {
  return {
    createMcpServer: jest.fn().mockImplementation(() => {
      return {
        registerTool: jest.fn(),
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined)
      };
    }),
    McpServer: jest.fn()
  };
});

jest.mock('../../tools', () => {
  return {
    registerTools: jest.fn()
  };
});

// Mock do console.log e console.error para evitar saídas durante os testes
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('deve criar e configurar o servidor MCP', () => {
    const server = createServer();
    
    // Verifica se o createMcpServer foi chamado com as opções corretas
    expect(createMcpServer).toHaveBeenCalledWith({
      description: 'Servidor MCP para integração com a API Bigboost da Bigdatacorp'
    });
    
    // Verifica se as ferramentas foram registradas
    expect(registerTools).toHaveBeenCalled();
    
    // Verifica se o servidor foi iniciado
    expect(server.start).toHaveBeenCalled();
    
    // Verifica se o servidor foi retornado
    expect(server).toBeDefined();
  });

  it('deve lidar com erros ao iniciar o servidor', async () => {
    // Salva a implementação original do server.ts
    const originalImplementation = jest.requireActual('../../server');
    const originalCreateServer = originalImplementation.createServer;
    
    // Substitui temporariamente a implementação para testes
    jest.doMock('../../server', () => ({
      createServer: jest.fn().mockImplementation(() => {
        const mockServer = {
          registerTool: jest.fn(),
          start: jest.fn().mockRejectedValue(new Error('Erro ao iniciar')),
          stop: jest.fn().mockResolvedValue(undefined)
        };
        return mockServer;
      })
    }));
    
    // Mock do process.exit para evitar que o teste encerre
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    
    // Mock do server.start para rejeitar com um erro
    const mockServer = {
      registerTool: jest.fn(),
      start: jest.fn().mockRejectedValue(new Error('Erro ao iniciar')),
      stop: jest.fn().mockResolvedValue(undefined)
    };
    (createMcpServer as jest.Mock).mockReturnValue(mockServer);
    
    // Executa a função
    createServer();
    
    // Espera que a Promise seja rejeitada
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verifica se console.error foi chamado com a mensagem correta
    expect(console.error).toHaveBeenCalledWith(
      'Erro ao iniciar o servidor MCP:',
      expect.any(Error)
    );
    
    // Restaura o mock do process.exit
    mockExit.mockRestore();
  });
});
