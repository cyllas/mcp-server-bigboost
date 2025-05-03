/**
 * Testes específicos para as rotas do ApiServer
 */
import { ApiServer, ApiTool } from '../../apiServer';

// Mock do express e seus métodos
jest.mock('express', () => {
  // Criamos funções mock para simular as rotas
  const mockPost = jest.fn();
  const mockGet = jest.fn();
  
  // Criamos um objeto app mock
  const mockApp = {
    use: jest.fn(),
    post: mockPost,
    get: mockGet,
    listen: jest.fn().mockImplementation((port, callback) => {
      if (callback) callback();
      return {
        close: jest.fn().mockImplementation(cb => cb && cb())
      };
    })
  };
  
  // Função mock para o express
  const mockExpress = jest.fn().mockReturnValue(mockApp);
  mockExpress.json = jest.fn().mockReturnValue('json-middleware');
  
  return mockExpress;
});

// Mock do console para evitar saídas durante os testes
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('ApiServer Rotas', () => {
  let apiServer: ApiServer;
  let postCallback: Function;
  let getToolsCallback: Function;
  let getStatusCallback: Function;
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Captura os callbacks das rotas
    const mockExpress = require('express')();
    
    mockExpress.post.mockImplementation((path: string, callback: Function) => {
      if (path === '/api') {
        postCallback = callback;
      }
      return mockExpress;
    });
    
    mockExpress.get.mockImplementation((path: string, callback: Function) => {
      if (path === '/api/tools') {
        getToolsCallback = callback;
      } else if (path === '/status') {
        getStatusCallback = callback;
      }
      return mockExpress;
    });
    
    // Inicializa o servidor
    apiServer = new ApiServer(3000);
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  it('deve registrar as rotas corretamente', () => {
    const mockExpress = require('express')();
    expect(mockExpress.post).toHaveBeenCalledWith('/api', expect.any(Function));
    expect(mockExpress.get).toHaveBeenCalledWith('/api/tools', expect.any(Function));
    expect(mockExpress.get).toHaveBeenCalledWith('/status', expect.any(Function));
  });
  
  it('deve listar as ferramentas disponíveis', () => {
    // Adiciona algumas ferramentas ao servidor
    const mockTool1: ApiTool = {
      name: 'tool1',
      description: 'Ferramenta 1',
      schema: { type: 'object' },
      handler: jest.fn()
    };
    
    const mockTool2: ApiTool = {
      name: 'tool2',
      description: 'Ferramenta 2',
      schema: { type: 'object' },
      handler: jest.fn()
    };
    
    apiServer['tools'].set('tool1', mockTool1);
    apiServer['tools'].set('tool2', mockTool2);
    
    // Mock para req e res
    const req = {};
    const res = { json: jest.fn() };
    
    // Executa o callback da rota
    getToolsCallback(req, res);
    
    // Verifica se a resposta contém as ferramentas
    expect(res.json).toHaveBeenCalledWith([
      {
        name: 'tool1',
        description: 'Ferramenta 1',
        schema: { type: 'object' }
      },
      {
        name: 'tool2',
        description: 'Ferramenta 2',
        schema: { type: 'object' }
      }
    ]);
  });
  
  it('deve retornar o status do servidor', () => {
    // Adiciona uma ferramenta para testar a contagem
    const mockTool: ApiTool = {
      name: 'testTool',
      description: 'Ferramenta de teste',
      schema: { type: 'object' },
      handler: jest.fn()
    };
    
    apiServer['tools'].set('testTool', mockTool);
    
    // Mock para process.uptime
    const originalUptime = process.uptime;
    process.uptime = jest.fn().mockReturnValue(123.456);
    
    // Mock para req e res
    const req = {};
    const res = { json: jest.fn() };
    
    // Executa o callback da rota
    getStatusCallback(req, res);
    
    // Verifica se a resposta contém o status correto
    expect(res.json).toHaveBeenCalledWith({
      status: 'online',
      toolsCount: 1,
      uptime: 123.456
    });
    
    // Restaura o mock
    process.uptime = originalUptime;
  });
  
  it('deve retornar erro 400 quando o nome da ferramenta não for especificado', () => {
    // Mock para req e res
    const req = { body: { parameters: { param1: 'value1' } } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Executa o callback da rota
    postCallback(req, res);
    
    // Verifica se retornou o erro correto
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nome da ferramenta não especificado' });
  });
  
  it('deve retornar erro 404 quando a ferramenta não for encontrada', () => {
    // Mock para req e res
    const req = { body: { name: 'nonExistentTool', parameters: { param1: 'value1' } } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Executa o callback da rota
    postCallback(req, res);
    
    // Verifica se retornou o erro correto
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Ferramenta 'nonExistentTool' não encontrada" });
  });
  
  it('deve executar a ferramenta e retornar o resultado', async () => {
    // Adiciona uma ferramenta ao servidor
    const mockResult = { data: 'resultado de teste' };
    const mockHandler = jest.fn().mockResolvedValue(mockResult);
    
    const mockTool: ApiTool = {
      name: 'testTool',
      description: 'Ferramenta de teste',
      schema: { type: 'object' },
      handler: mockHandler
    };
    
    apiServer['tools'].set('testTool', mockTool);
    
    // Mock para req e res
    const req = { body: { name: 'testTool', parameters: { param1: 'value1' } } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Executa o callback da rota
    await postCallback(req, res);
    
    // Verifica se o handler foi chamado e o resultado retornado
    expect(mockHandler).toHaveBeenCalledWith({ param1: 'value1' });
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
});
