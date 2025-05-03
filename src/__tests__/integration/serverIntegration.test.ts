// Mock da classe McpServer
class MockMcpServer {
  tool: jest.Mock;

  constructor() {
    this.tool = jest.fn();
  }
}

// Substituir a importação real por nossa classe mock
jest.mock('../../mcpServer', () => ({
  McpServer: MockMcpServer
}));

import { registerConsultaPessoaEmailTool } from '../../tools/consultaPessoaEmailTool';
import { registerConsultaPessoaTool } from '../../tools/consultaPessoaTool';
import { registerConsultaEmpresaTool } from '../../tools/consultaEmpresaTool';
import { registerConsultaQsaTool } from '../../tools/consultaQsaTool';
import { registerConsultaRegistroEmpresaTool } from '../../tools/consultaRegistroEmpresaTool';
import { registerConsultaPessoaTelefoneTool } from '../../tools/consultaPessoaTelefoneTool';
import { bigboostService } from '../../services/bigboostService';
import { BigboostResponseWithStatus } from '../../types/errorTypes';
import { McpServer } from '../../mcpServer';

// Mock das dependências
jest.mock('../../services/bigboostService', () => ({
  bigboostService: {
    executeQuery: jest.fn()
  }
}));

const mockedBigboostService = bigboostService as jest.Mocked<typeof bigboostService>;

describe('Integração do Servidor MCP', () => {
  let server: McpServer;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Cria uma instância do servidor MCP para testes
    server = new McpServer();
  });

  it('deve registrar todas as ferramentas no servidor', () => {
    // Registra todas as ferramentas
    registerConsultaPessoaEmailTool(server);
    registerConsultaPessoaTool(server);
    registerConsultaEmpresaTool(server);
    registerConsultaQsaTool(server);
    registerConsultaRegistroEmpresaTool(server);
    registerConsultaPessoaTelefoneTool(server);

    // Verifica se o método tool foi chamado para cada ferramenta
    expect(server.tool).toHaveBeenCalledTimes(6);
    
    // Verifica se as ferramentas foram registradas com os nomes corretos
    const toolNames = [
      'consultaPessoaEmail',
      'consultaPessoa',
      'consultaEmpresa',
      'consultaQsa',
      'consultaRegistroEmpresa',
      'consultaPessoaTelefone'
    ];
    
    toolNames.forEach(name => {
      const toolCalls = (server.tool as jest.Mock).mock.calls;
      const hasToolWithName = toolCalls.some(call => call[0] === name);
      expect(hasToolWithName).toBe(true);
    });
  });

  it('deve configurar o fluxo completo para consulta de pessoa por email', async () => {
    // Registra a ferramenta de consulta por email
    registerConsultaPessoaEmailTool(server);
    
    // Captura o handler registrado
    const toolCalls = (server.tool as jest.Mock).mock.calls;
    const emailToolCall = toolCalls.find(call => call[0] === 'consultaPessoaEmail');
    expect(emailToolCall).toBeDefined();
    
    const [_, schema, handler] = emailToolCall!;
    
    // Configura o mock do bigboostService para retornar uma resposta de sucesso
    const mockResponse = {
      result: [
        {
          MatchKeys: 'email',
          BasicData: {
            TaxIdNumber: '123.456.789-00',
            Name: 'Nome Teste',
            BirthDate: '1990-01-01'
          }
        }
      ],
      status: [{ code: 0, message: 'OK' }],
      QueryId: '123456',
      ElapsedMilliseconds: 100,
      QueryDate: '2023-01-01T00:00:00Z'
    };
    
    mockedBigboostService.executeQuery.mockResolvedValue(mockResponse);
    
    // Executa o handler com um email de teste
    const params = { email: 'teste@exemplo.com' };
    const result = await handler(params);
    
    // Verifica se o bigboostService.executeQuery foi chamado com os parâmetros corretos
    expect(mockedBigboostService.executeQuery).toHaveBeenCalledWith(
      '/pessoas',
      {
        q: 'email{teste@exemplo.com}',
        Datasets: 'basic_data'
      }
    );
    
    // Verifica se o resultado tem a estrutura esperada
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content[0]).toHaveProperty('text');
    expect(typeof result.content[0].text).toBe('string');
  });

  it('deve tratar erros no fluxo de integração', async () => {
    // Registra a ferramenta de consulta por email
    registerConsultaPessoaEmailTool(server);
    
    // Captura o handler registrado
    const toolCalls = (server.tool as jest.Mock).mock.calls;
    const emailToolCall = toolCalls.find(call => call[0] === 'consultaPessoaEmail');
    const [_, schema, handler] = emailToolCall!;
    
    // Configura o mock do bigboostService para lançar um erro
    const error = new Error('Erro na API');
    mockedBigboostService.executeQuery.mockRejectedValue(error);
    
    // Executa o handler com um email de teste
    const params = { email: 'teste@exemplo.com' };
    const result = await handler(params);
    
    // Verifica se o resultado contém a mensagem de erro
    expect(result.content[0].text).toContain('Erro na API');
  });
});
