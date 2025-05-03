import { registerConsultaPessoaTool } from '../../../tools/consultaPessoaTool';
import { bigboostService } from '../../../services/bigboostService';
import * as baseTools from '../../../tools/baseTools';

// Mock das dependências
jest.mock('../../../services/bigboostService', () => ({
  bigboostService: {
    executeQuery: jest.fn()
  }
}));

jest.mock('../../../tools/baseTools', () => ({
  registerTool: jest.fn()
}));

describe('consultaPessoaTool', () => {
  const mockServer: any = {
    registerTool: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve registrar a ferramenta corretamente', () => {
    registerConsultaPessoaTool(mockServer);
    
    expect(baseTools.registerTool).toHaveBeenCalledWith(
      mockServer,
      'consultaPessoa',
      'Consulta dados básicos de uma pessoa pelo CPF',
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('deve validar o formato do CPF', async () => {
    // Captura a função de handler
    registerConsultaPessoaTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService
    const mockResponse = {
      Result: [
        {
          MatchKeys: 'doc{12345678900}',
          BasicData: {
            TaxIdNumber: '12345678900',
            Name: 'João Silva',
            BirthDate: '1990-01-01'
          }
        }
      ],
      Status: {},
      QueryId: '123456',
      ElapsedMilliseconds: 100,
      QueryDate: '2023-01-01T12:00:00Z'
    };
    
    (bigboostService.executeQuery as jest.Mock).mockResolvedValue(mockResponse);
    
    // Executa o handler com um CPF formatado
    const result = await handlerFunction({ cpf: '123.456.789-00' });
    
    // Verifica se o CPF foi limpo corretamente
    expect(bigboostService.executeQuery).toHaveBeenCalledWith(
      '/pessoas',
      {
        q: 'doc{12345678900}',
        Datasets: 'basic_data'
      }
    );
    
    // Verifica o resultado
    expect(result).toEqual({
      result: mockResponse.Result,
      status: mockResponse.Status,
      queryId: mockResponse.QueryId,
      elapsedMilliseconds: mockResponse.ElapsedMilliseconds,
      queryDate: mockResponse.QueryDate
    });
  });

  it('deve limpar diferentes formatos de CPF', async () => {
    // Captura a função de handler
    registerConsultaPessoaTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService
    (bigboostService.executeQuery as jest.Mock).mockResolvedValue({
      Result: [],
      Status: {}
    });
    
    // Testa diferentes formatos de CPF
    const formatos = [
      '123.456.789-00',
      '123456789-00',
      '123.456.78900',
      '12345678900'
    ];
    
    for (const cpf of formatos) {
      await handlerFunction({ cpf });
      
      // Verifica se o CPF foi limpo corretamente em todos os casos
      expect(bigboostService.executeQuery).toHaveBeenCalledWith(
        '/pessoas',
        {
          q: 'doc{12345678900}',
          Datasets: 'basic_data'
        }
      );
      
      // Limpa o mock para o próximo teste
      (bigboostService.executeQuery as jest.Mock).mockClear();
    }
  });

  it('deve lidar com resposta vazia da API', async () => {
    // Captura a função de handler
    registerConsultaPessoaTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService para retornar uma resposta vazia
    const mockEmptyResponse = {};
    (bigboostService.executeQuery as jest.Mock).mockResolvedValue(mockEmptyResponse);
    
    // Executa o handler
    const result = await handlerFunction({ cpf: '12345678900' });
    
    // Verifica o resultado
    expect(result).toEqual({
      result: [],
      status: {},
      queryId: undefined,
      elapsedMilliseconds: undefined,
      queryDate: undefined
    });
  });

  it('deve propagar erros da API', async () => {
    // Captura a função de handler
    registerConsultaPessoaTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService para lançar um erro
    const mockError = new Error('Erro na API');
    (bigboostService.executeQuery as jest.Mock).mockRejectedValue(mockError);
    
    // Verifica se o erro é propagado
    await expect(handlerFunction({ cpf: '12345678900' })).rejects.toThrow('Erro na API');
  });
});
