import { registerTools } from '../../../tools';
import { registerConsultaPessoaTool } from '../../../tools/consultaPessoaTool';
import { registerConsultaEmpresaTool } from '../../../tools/consultaEmpresaTool';
import { registerConsultaQsaTool } from '../../../tools/consultaQsaTool';
import { registerConsultaRegistroEmpresaTool } from '../../../tools/consultaRegistroEmpresaTool';
import { registerConsultaPessoaTelefoneTool } from '../../../tools/consultaPessoaTelefoneTool';
import { registerConsultaPessoaEmailTool } from '../../../tools/consultaPessoaEmailTool';

// Mock de todas as ferramentas
jest.mock('../../../tools/consultaPessoaTool', () => ({
  registerConsultaPessoaTool: jest.fn()
}));

jest.mock('../../../tools/consultaEmpresaTool', () => ({
  registerConsultaEmpresaTool: jest.fn()
}));

jest.mock('../../../tools/consultaQsaTool', () => ({
  registerConsultaQsaTool: jest.fn()
}));

jest.mock('../../../tools/consultaRegistroEmpresaTool', () => ({
  registerConsultaRegistroEmpresaTool: jest.fn()
}));

jest.mock('../../../tools/consultaPessoaTelefoneTool', () => ({
  registerConsultaPessoaTelefoneTool: jest.fn()
}));

jest.mock('../../../tools/consultaPessoaEmailTool', () => ({
  registerConsultaPessoaEmailTool: jest.fn()
}));

describe('Tools Index', () => {
  // Mock do console.log para evitar saídas durante os testes
  const originalConsoleLog = console.log;
  
  beforeEach(() => {
    console.log = jest.fn();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it('deve registrar todas as ferramentas corretamente', () => {
    // Mock do servidor MCP
    const mockServer = {
      registerTool: jest.fn(),
      tool: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    } as any; // Usando any para evitar problemas de tipagem no teste
    
    // Chama a função registerTools
    registerTools(mockServer);
    
    // Verifica se todas as ferramentas foram registradas
    expect(registerConsultaPessoaTool).toHaveBeenCalledWith(mockServer);
    expect(registerConsultaEmpresaTool).toHaveBeenCalledWith(mockServer);
    expect(registerConsultaQsaTool).toHaveBeenCalledWith(mockServer);
    expect(registerConsultaRegistroEmpresaTool).toHaveBeenCalledWith(mockServer);
    expect(registerConsultaPessoaTelefoneTool).toHaveBeenCalledWith(mockServer);
    expect(registerConsultaPessoaEmailTool).toHaveBeenCalledWith(mockServer);
    
    // Verifica se a mensagem de sucesso foi exibida
    expect(console.log).toHaveBeenCalledWith('Ferramentas registradas com sucesso');
  });
});
