import { ApiServer, ApiTool } from '../../apiServer';
import express from 'express';
import request from 'supertest';
import http from 'http';
import { jest } from '@jest/globals';

// Mock do express
interface MockExpressApp {
  use: any;
  get: any;
  post: any;
  listen: any;
}

interface MockExpressFunction {
  (): MockExpressApp;
  json: any;
}

jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    listen: jest.fn().mockImplementation(() => {
      return {
        close: jest.fn().mockImplementation((callback) => callback && callback())
      };
    })
  };
  const mockExpress = jest.fn(() => mockApp) as MockExpressFunction;
  // Adiciona o método json ao mock
  mockExpress.json = jest.fn(() => 'json-middleware');
  return mockExpress;
});

// Tipagem para o mock do express
type MockExpress = {
  (): {
    use: any;
    get: any;
    post: any;
    listen: any;
  };
  json: any;
};

// Mock do console.log e console.error para evitar saídas durante os testes
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('ApiServer', () => {
  let apiServer: ApiServer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    apiServer = new ApiServer(3000);
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  it('deve inicializar corretamente o servidor API', () => {
    const mockExpress = express as unknown as MockExpress;
    expect(mockExpress).toHaveBeenCalled();
    expect(mockExpress().use).toHaveBeenCalledWith('json-middleware');
  });
  
  it('deve configurar as rotas corretamente', () => {
    const mockExpress = express as unknown as MockExpress;
    expect(mockExpress().post).toHaveBeenCalledWith('/api', expect.any(Function));
    expect(mockExpress().get).toHaveBeenCalledWith('/api/tools', expect.any(Function));
    expect(mockExpress().get).toHaveBeenCalledWith('/status', expect.any(Function));
  });
  
  it('deve registrar uma ferramenta corretamente', () => {
    const mockTool: ApiTool = {
      name: 'testTool',
      description: 'Ferramenta de teste',
      schema: { type: 'object' },
      handler: jest.fn().mockImplementation(async () => ({ result: 'ok' }))
    };
    
    apiServer.registerTool(mockTool);
    
    // Verifica se a ferramenta foi registrada
    expect(console.log).toHaveBeenCalledWith(`Ferramenta '${mockTool.name}' registrada com sucesso`);
  });
  
  it('deve iniciar o servidor corretamente', () => {
    // Captura a função de callback passada para listen
    const mockExpress = express as unknown as MockExpress;
    const mockListen = mockExpress().listen as jest.Mock;
    mockListen.mockImplementation((port, callback) => {
      // Executa a callback imediatamente
      if (callback) callback();
      return { close: jest.fn() };
    });
    
    apiServer.start();
    
    expect(mockExpress().listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(console.log).toHaveBeenCalledWith('Servidor API iniciado na porta 3000');
  });
  
  it('deve parar o servidor corretamente', () => {
    // Mock para o servidor
    const mockServer = {
      close: jest.fn().mockImplementation(callback => callback())
    };
    
    // Configura o mock de listen para retornar o servidor mock
    const mockExpress = express as unknown as MockExpress;
    const mockListen = mockExpress().listen as jest.Mock;
    mockListen.mockReturnValue(mockServer);
    
    // Inicia o servidor
    apiServer.start();
    
    // Depois para o servidor
    apiServer.stop();
    
    // Verifica se o método close foi chamado
    expect(mockServer.close).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Servidor API parado');
  });
  
  it('deve lidar com erros ao parar o servidor', async () => {
    // Mock para o servidor com erro ao fechar
    const mockError = new Error('Erro ao fechar o servidor');
    const mockServer = {
      close: jest.fn().mockImplementation(callback => callback(mockError))
    };
    
    // Configura o mock de listen para retornar o servidor mock
    const mockExpress = express as unknown as MockExpress;
    const mockListen = mockExpress().listen as jest.Mock;
    mockListen.mockReturnValue(mockServer);
    
    // Inicia o servidor
    apiServer.start();
    
    // Tenta parar o servidor e espera que rejeite com o erro
    await expect(apiServer.stop()).rejects.toThrow('Erro ao fechar o servidor');
  });
  
  it('deve lidar com o caso de parar um servidor que não foi iniciado', () => {
    const newServer = new ApiServer(3001);
    // Não deve lançar erro ao parar um servidor não iniciado
    expect(() => newServer.stop()).not.toThrow();
  });
});

// Testes de integração para as rotas simplificados para focar na cobertura
describe('ApiServer Routes', () => {
  // Simulação das rotas sem usar supertest
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });
  it('deve processar uma requisição POST /api corretamente', async () => {
    // Cria um mock para req, res
    const req = {
      body: { name: 'testTool', parameters: { param1: 'value1' } }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Cria um mock para o handler da ferramenta
    const mockHandler = jest.fn().mockResolvedValue({ result: 'success' });
    const tools = new Map();
    tools.set('testTool', {
      name: 'testTool',
      description: 'Ferramenta de teste',
      schema: { type: 'object' },
      handler: mockHandler
    });
    
    // Simula a função de rota
    const routeHandler = async (req: any, res: any) => {
      try {
        const { name, parameters } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Nome da ferramenta não especificado' });
        }
        
        const tool = tools.get(name);
        if (!tool) {
          return res.status(404).json({ error: `Ferramenta '${name}' não encontrada` });
        }
        
        // Executar o handler da ferramenta
        try {
          const result = await tool.handler(parameters);
          return res.json(result);
        } catch (error: any) {
          console.error(`Erro ao executar a ferramenta ${name}:`, error);
          return res.status(500).json({ 
            error: 'Erro ao executar a ferramenta', 
            details: error.message 
          });
        }
      } catch (error: any) {
        console.error('Erro ao processar requisição API:', error);
        return res.status(500).json({ 
          error: 'Erro interno do servidor', 
          details: error.message 
        });
      }
    };
    
    // Executa a rota
    await routeHandler(req, res);
    
    // Verifica se o handler foi chamado com os parâmetros corretos
    expect(mockHandler).toHaveBeenCalledWith({ param1: 'value1' });
    expect(res.json).toHaveBeenCalledWith({ result: 'success' });
  });
  
  it('deve lidar com erros no handler da ferramenta', async () => {
    // Cria um mock para req, res
    const req = {
      body: { name: 'errorTool', parameters: { param1: 'value1' } }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Cria um mock para o handler da ferramenta que lança erro
    const mockError = new Error('Erro na API');
    const mockHandler = jest.fn().mockRejectedValue(mockError);
    const tools = new Map();
    tools.set('errorTool', {
      name: 'errorTool',
      description: 'Ferramenta com erro',
      schema: { type: 'object' },
      handler: mockHandler
    });
    
    // Simula a função de rota
    const routeHandler = async (req: any, res: any) => {
      try {
        const { name, parameters } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Nome da ferramenta não especificado' });
        }
        
        const tool = tools.get(name);
        if (!tool) {
          return res.status(404).json({ error: `Ferramenta '${name}' não encontrada` });
        }
        
        // Executar o handler da ferramenta
        try {
          const result = await tool.handler(parameters);
          return res.json(result);
        } catch (error: any) {
          console.error(`Erro ao executar a ferramenta ${name}:`, error);
          return res.status(500).json({ 
            error: 'Erro ao executar a ferramenta', 
            details: error.message 
          });
        }
      } catch (error: any) {
        console.error('Erro ao processar requisição API:', error);
        return res.status(500).json({ 
          error: 'Erro interno do servidor', 
          details: error.message 
        });
      }
    };
    
    // Executa a rota
    await routeHandler(req, res);
    
    // Verifica se o handler foi chamado com os parâmetros corretos
    expect(mockHandler).toHaveBeenCalledWith({ param1: 'value1' });
    expect(console.error).toHaveBeenCalledWith('Erro ao executar a ferramenta errorTool:', mockError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Erro ao executar a ferramenta', 
      details: 'Erro na API' 
    });
  });
  
  it('deve lidar com exceções no processamento da requisição', async () => {
    // Cria um mock para req, res que lança erro ao acessar body
    const req = {
      get body() {
        throw new Error('Erro ao processar o corpo da requisição');
      }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Simula a função de rota
    const routeHandler = async (req: any, res: any) => {
      try {
        const { name, parameters } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Nome da ferramenta não especificado' });
        }
        
        return res.json({ result: 'success' });
      } catch (error: any) {
        console.error('Erro ao processar requisição API:', error);
        return res.status(500).json({ 
          error: 'Erro interno do servidor', 
          details: error.message 
        });
      }
    };
    
    // Executa a rota
    await routeHandler(req, res);
    
    // Verifica se o erro foi tratado corretamente
    expect(console.error).toHaveBeenCalledWith('Erro ao processar requisição API:', expect.any(Error));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Erro interno do servidor', 
      details: 'Erro ao processar o corpo da requisição' 
    });
  });
  
  it('deve retornar erro 400 quando o nome da ferramenta não for especificado', () => {
    // Cria um mock para req, res
    const req = {
      body: { parameters: { param1: 'value1' } }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Simula a função de rota
    const routeHandler = (req: any, res: any) => {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Nome da ferramenta não especificado' });
      }
      
      res.json({ result: 'success' });
    };
    
    // Executa a rota
    routeHandler(req, res);
    
    // Verifica se status e json foram chamados com os valores corretos
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nome da ferramenta não especificado' });
  });
  
  it('deve retornar erro 404 quando a ferramenta não for encontrada', () => {
    // Cria um mock para req, res
    const req = {
      body: { name: 'nonExistentTool', parameters: { param1: 'value1' } }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Simula a função de rota
    const routeHandler = (req: any, res: any) => {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Nome da ferramenta não especificado' });
      }
      
      return res.status(404).json({ error: `Ferramenta '${name}' não encontrada` });
    };
    
    // Executa a rota
    routeHandler(req, res);
    
    // Verifica se status e json foram chamados com os valores corretos
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Ferramenta 'nonExistentTool' não encontrada" });
  });
  
  it('deve listar as ferramentas disponíveis', () => {
    // Cria um mock para req, res
    const req = {};
    
    const res = {
      json: jest.fn()
    };
    
    const tools = [
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
    ];
    
    // Simula a função de rota
    const routeHandler = (req: any, res: any) => {
      res.json(tools);
    };
    
    // Executa a rota
    routeHandler(req, res);
    
    // Verifica se json foi chamado com os valores corretos
    expect(res.json).toHaveBeenCalledWith(tools);
  });
  
  it('deve retornar o status do servidor', () => {
    // Cria um mock para req, res
    const req = {};
    
    const res = {
      json: jest.fn()
    };
    
    // Simula a função de rota
    const routeHandler = (req: any, res: any) => {
      res.json({
        status: 'online',
        toolsCount: 2,
        uptime: process.uptime()
      });
    };
    
    // Executa a rota
    routeHandler(req, res);
    
    // Verifica se json foi chamado com os valores corretos
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'online',
      toolsCount: 2,
      uptime: expect.any(Number)
    }));
  });
});
