import { registerConsultaPessoaEmailTool } from '../../../tools/consultaPessoaEmailTool';
import { registerTool } from '../../../tools/baseTools';
import { bigboostService } from '../../../services/bigboostService';
import { BigboostResponseWithStatus } from '../../../types/errorTypes';

// Mock das dependências
jest.mock('../../../tools/baseTools', () => ({
  registerTool: jest.fn()
}));

jest.mock('../../../services/bigboostService', () => ({
  bigboostService: {
    executeQuery: jest.fn()
  }
}));

const mockedRegisterTool = registerTool as jest.MockedFunction<typeof registerTool>;
const mockedBigboostService = bigboostService as jest.Mocked<typeof bigboostService>;

describe('consultaPessoaEmailTool', () => {
  // Mock do servidor MCP
  const mockServer = {
    tool: jest.fn()
  };

  // Reset dos mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerConsultaPessoaEmailTool', () => {
    it('deve registrar a ferramenta no servidor MCP com os parâmetros corretos', () => {
      // Executa a função
      registerConsultaPessoaEmailTool(mockServer as any);

      // Verifica se registerTool foi chamado com os parâmetros corretos
      expect(mockedRegisterTool).toHaveBeenCalledWith(
        mockServer,
        'consultaPessoaEmail',
        'Consulta dados básicos de uma pessoa pelo endereço de email',
        expect.objectContaining({
          email: expect.any(Object)
        }),
        expect.any(Function)
      );
    });

    it('deve executar a consulta na API Bigboost com o payload correto', async () => {
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

      // Captura o handler registrado
      registerConsultaPessoaEmailTool(mockServer as any);
      const handler = mockedRegisterTool.mock.calls[0][4];

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

      // Verifica apenas que o resultado contém as propriedades esperadas
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('queryId');
      expect(result).toHaveProperty('elapsedMilliseconds');
      expect(result).toHaveProperty('queryDate');
      expect(result).toHaveProperty('evidences');
    });

    it('deve tratar corretamente quando a API retorna resultado vazio', async () => {
      // Configura o mock do bigboostService para retornar uma resposta vazia
      const mockResponse = {
        result: [],
        status: [{ code: 0, message: 'OK' }],
        QueryId: '123456',
        ElapsedMilliseconds: 50,
        QueryDate: '2023-01-01T00:00:00Z'
      };

      mockedBigboostService.executeQuery.mockResolvedValue(mockResponse);

      // Captura o handler registrado
      registerConsultaPessoaEmailTool(mockServer as any);
      const handler = mockedRegisterTool.mock.calls[0][4];

      // Executa o handler com um email de teste
      const params = { email: 'naoexiste@exemplo.com' };
      const result = await handler(params);

      // Verifica apenas que o resultado contém as propriedades esperadas
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('queryId');
      expect(result).toHaveProperty('elapsedMilliseconds');
      expect(result).toHaveProperty('queryDate');
      expect(result).toHaveProperty('evidences');
    });

    it('deve propagar erros lançados pelo bigboostService', async () => {
      // Configura o mock do bigboostService para lançar um erro
      const error = new Error('Erro na API');
      mockedBigboostService.executeQuery.mockRejectedValue(error);

      // Captura o handler registrado
      registerConsultaPessoaEmailTool(mockServer as any);
      const handler = mockedRegisterTool.mock.calls[0][4];

      // Executa o handler e verifica se o erro é propagado
      const params = { email: 'teste@exemplo.com' };
      await expect(handler(params)).rejects.toThrow('Erro na API');
    });
  });
});
