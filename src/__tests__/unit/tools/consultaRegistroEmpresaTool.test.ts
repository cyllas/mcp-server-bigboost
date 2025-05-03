import { registerConsultaRegistroEmpresaTool } from '../../../tools/consultaRegistroEmpresaTool';
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

describe('consultaRegistroEmpresaTool', () => {
  const mockServer: any = {
    registerTool: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve registrar a ferramenta corretamente', () => {
    registerConsultaRegistroEmpresaTool(mockServer);
    
    expect(baseTools.registerTool).toHaveBeenCalledWith(
      mockServer,
      'consultaRegistroEmpresa',
      'Consulta dados completos de registro de uma empresa pelo CNPJ, incluindo endereços e contatos',
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('deve validar o formato do CNPJ', async () => {
    // Captura a função de handler
    registerConsultaRegistroEmpresaTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService
    const mockResponse = {
      Result: [
        {
          MatchKeys: 'doc{12345678000190}',
          RegistrationData: {
            BasicData: {
              TaxIdNumber: '12345678000190',
              OfficialName: 'Empresa Teste LTDA',
              TradeName: 'Empresa Teste',
              TaxIdStatus: 'ATIVA',
              FoundedDate: '2000-01-01'
            },
            Emails: {
              Primary: {
                EmailAddress: 'contato@empresateste.com.br',
                Domain: 'empresateste.com.br',
                UserName: 'contato'
              }
            },
            Addresses: {
              Primary: {
                AddressMain: 'Rua Teste',
                Number: '123',
                Neighborhood: 'Centro',
                City: 'São Paulo',
                State: 'SP',
                ZipCode: '01234-567'
              }
            },
            Phones: {
              Primary: {
                Number: '12345678',
                AreaCode: '11',
                CountryCode: '55'
              }
            }
          }
        }
      ],
      Status: {},
      QueryId: '123456',
      ElapsedMilliseconds: 100,
      QueryDate: '2023-01-01T12:00:00Z'
    };
    
    (bigboostService.executeQuery as jest.Mock).mockResolvedValue(mockResponse);
    
    // Executa o handler com um CNPJ formatado
    const result = await handlerFunction({ cnpj: '12.345.678/0001-90' });
    
    // Verifica se o CNPJ foi limpo corretamente
    expect(bigboostService.executeQuery).toHaveBeenCalledWith(
      '/empresas',
      {
        q: 'doc{12345678000190}',
        Datasets: 'registration_data'
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

  it('deve limpar diferentes formatos de CNPJ', async () => {
    // Captura a função de handler
    registerConsultaRegistroEmpresaTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService
    (bigboostService.executeQuery as jest.Mock).mockResolvedValue({
      Result: [],
      Status: {}
    });
    
    // Testa diferentes formatos de CNPJ
    const formatos = [
      '12.345.678/0001-90',
      '12345678/0001-90',
      '12.345.678/000190',
      '12345678000190'
    ];
    
    for (const cnpj of formatos) {
      await handlerFunction({ cnpj });
      
      // Verifica se o CNPJ foi limpo corretamente em todos os casos
      expect(bigboostService.executeQuery).toHaveBeenCalledWith(
        '/empresas',
        {
          q: 'doc{12345678000190}',
          Datasets: 'registration_data'
        }
      );
      
      // Limpa o mock para o próximo teste
      (bigboostService.executeQuery as jest.Mock).mockClear();
    }
  });

  it('deve lidar com resposta vazia da API', async () => {
    // Captura a função de handler
    registerConsultaRegistroEmpresaTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService para retornar uma resposta vazia
    const mockEmptyResponse = {};
    (bigboostService.executeQuery as jest.Mock).mockResolvedValue(mockEmptyResponse);
    
    // Executa o handler
    const result = await handlerFunction({ cnpj: '12345678000190' });
    
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
    registerConsultaRegistroEmpresaTool(mockServer);
    const handlerFunction = (baseTools.registerTool as jest.Mock).mock.calls[0][4];
    
    // Configura o mock do bigboostService para lançar um erro
    const mockError = new Error('Erro na API');
    (bigboostService.executeQuery as jest.Mock).mockRejectedValue(mockError);
    
    // Verifica se o erro é propagado
    await expect(handlerFunction({ cnpj: '12345678000190' })).rejects.toThrow('Erro na API');
  });
});
