import { registerConsultaPessoaTelefoneTool } from '../../../tools/consultaPessoaTelefoneTool';
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

describe('consultaPessoaTelefoneTool', () => {
  const mockServer: any = {
    registerTool: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve registrar a ferramenta corretamente', () => {
    registerConsultaPessoaTelefoneTool(mockServer);
    
    expect(baseTools.registerTool).toHaveBeenCalledWith(
      mockServer,
      'consultaPessoaTelefone',
      'Consulta dados básicos de uma pessoa pelo número de telefone',
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('deve validar o formato do telefone', async () => {
    // Captura a função de handler
    registerConsultaPessoaTelefoneTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService
    const mockResponse = {
      Result: [
        {
          MatchKeys: 'phone{11987654321}',
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
    
    // Executa o handler com um telefone formatado
    const result = await handlerFunction({ telefone: '(11) 98765-4321' });
    
    // Verifica se o telefone foi limpo corretamente
    expect(bigboostService.executeQuery).toHaveBeenCalledWith(
      '/pessoas',
      {
        q: 'phone{11987654321}',
        Datasets: 'basic_data'
      }
    );
    
    // Verifica o resultado
    expect(result).toEqual({
      result: mockResponse.Result,
      status: mockResponse.Status,
      queryId: mockResponse.QueryId,
      elapsedMilliseconds: mockResponse.ElapsedMilliseconds,
      queryDate: mockResponse.QueryDate,
      evidences: {}
    });
  });

  it('deve limpar diferentes formatos de telefone', async () => {
    // Captura a função de handler
    registerConsultaPessoaTelefoneTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService
    (bigboostService.executeQuery as jest.Mock).mockResolvedValue({
      Result: [],
      Status: {}
    });
    
    // Testa diferentes formatos de telefone e os resultados esperados
    const formatosETelefoneEsperado = [
      { formato: '+55 (11) 98765-4321', esperado: '5511987654321' },
      { formato: '11 98765 4321', esperado: '11987654321' },
      { formato: '11.98765.4321', esperado: '11987654321' },
      { formato: '11987654321', esperado: '11987654321' }
    ];
    
    for (const { formato, esperado } of formatosETelefoneEsperado) {
      await handlerFunction({ telefone: formato });
      
      // Verifica se o telefone foi limpo corretamente em cada caso
      expect(bigboostService.executeQuery).toHaveBeenCalledWith(
        '/pessoas',
        {
          q: `phone{${esperado}}`,
          Datasets: 'basic_data'
        }
      );
      
      // Limpa o mock para o próximo teste
      (bigboostService.executeQuery as jest.Mock).mockClear();
    }
  });

  it('deve lidar com resposta vazia da API', async () => {
    // Captura a função de handler
    registerConsultaPessoaTelefoneTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService para retornar uma resposta vazia
    const mockEmptyResponse = {};
    (bigboostService.executeQuery as jest.Mock).mockResolvedValue(mockEmptyResponse);
    
    // Executa o handler
    const result = await handlerFunction({ telefone: '11987654321' });
    
    // Verifica o resultado
    expect(result).toEqual({
      result: [],
      status: {},
      queryId: undefined,
      elapsedMilliseconds: undefined,
      queryDate: undefined,
      evidences: {}
    });
  });

  it('deve propagar erros da API', async () => {
    // Captura a função de handler
    registerConsultaPessoaTelefoneTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService para lançar um erro
    const mockError = new Error('Erro na API');
    (bigboostService.executeQuery as jest.Mock).mockRejectedValue(mockError);
    
    // Verifica se o erro é propagado
    await expect(handlerFunction({ telefone: '11987654321' })).rejects.toThrow('Erro na API');
  });
});
