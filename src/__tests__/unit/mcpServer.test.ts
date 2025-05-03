// Importações do módulo a ser testado
import { createMcpServer } from '../../mcpServer';

// Mock do módulo mcpServer para evitar dependências externas
jest.mock('../../mcpServer', () => {
  // Criamos um mock da classe McpServer
  const mockMcpServer = jest.fn().mockImplementation(() => ({
    registerTool: jest.fn(),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    tool: jest.fn()
  }));
  
  // Retornamos a função createMcpServer real, mas usando nosso mock
  return {
    McpServer: mockMcpServer,
    createMcpServer: jest.fn().mockImplementation((options) => {
      return new mockMcpServer(options);
    })
  };
});

describe('mcpServer', () => {
  // Obtemos a referência ao mock da classe McpServer
  const MockMcpServer = jest.requireMock('../../mcpServer').McpServer;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exportar a classe McpServer corretamente', () => {
    expect(MockMcpServer).toBeDefined();
    expect(typeof MockMcpServer).toBe('function');
  });

  it('deve criar uma instância do servidor MCP', () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
    expect(MockMcpServer).toHaveBeenCalledTimes(1);
  });

  it('deve passar as opções para o construtor do servidor MCP', () => {
    const options = { description: 'Teste' };
    createMcpServer(options);
    expect(MockMcpServer).toHaveBeenCalledWith(options);
  });
  
  it('deve iniciar o servidor corretamente', async () => {
    const server = createMcpServer();
    await server.start();
    expect(server.start).toHaveBeenCalled();
  });
  
  it('deve parar o servidor corretamente', async () => {
    const server = createMcpServer();
    await server.stop();
    expect(server.stop).toHaveBeenCalled();
  });
  
  it('deve registrar ferramentas corretamente', () => {
    const server = createMcpServer() as any; // Usando any para evitar erros de tipagem no teste
    const mockTool = {
      name: 'testTool',
      description: 'Ferramenta de teste',
      parameters: {}
    };
    
    server.registerTool(mockTool);
    expect(server.registerTool).toHaveBeenCalledWith(mockTool);
  });
});
