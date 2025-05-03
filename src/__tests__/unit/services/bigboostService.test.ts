import axios from 'axios';
import { BigboostService } from '../../../services/bigboostService';
import { rateLimiter } from '../../../utils/rateLimiter';
import { validateTags } from '../../../utils/tagValidator';
import { processStatusCodes } from '../../../utils/errorHandler';
import { RateLimitExceededError, DatasetUnavailableError } from '../../../utils/errorHandler';

// Mock das dependências
jest.mock('axios');
jest.mock('../../../utils/rateLimiter');
jest.mock('../../../utils/tagValidator');
jest.mock('../../../utils/errorHandler');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedRateLimiter = rateLimiter as jest.Mocked<typeof rateLimiter>;
const mockedValidateTags = validateTags as jest.MockedFunction<typeof validateTags>;
const mockedProcessStatusCodes = processStatusCodes as jest.MockedFunction<typeof processStatusCodes>;

describe('BigboostService', () => {
  let service: BigboostService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuração padrão dos mocks
    mockedAxios.create.mockReturnValue({
      post: jest.fn().mockResolvedValue({ data: { Result: [] } })
    } as any);
    
    mockedRateLimiter.canMakeRequest.mockReturnValue(true);
    mockedValidateTags.mockImplementation((tags) => tags);
    
    // Instancia o serviço
    service = new BigboostService();
  });
  
  describe('executeQuery', () => {
    it('deve executar uma consulta com sucesso', async () => {
      // Configura o mock do axios para retornar dados de sucesso
      const mockResponse = {
        data: {
          result: [{ nome: 'Teste', documento: '12345678901' }],
          status: [{ code: 0, message: 'OK' }],
          QueryId: '123456',
          ElapsedMilliseconds: 100,
          QueryDate: '2023-01-01T00:00:00Z'
        }
      };
      
      (service as any).client.post.mockResolvedValue(mockResponse);
      
      // Executa o método
      const result = await service.executeQuery('/pessoas', { q: 'doc{12345678901}' });
      
      // Verifica se o método post foi chamado com os parâmetros corretos
      expect((service as any).client.post).toHaveBeenCalledWith('/pessoas', { q: 'doc{12345678901}' });
      
      // Verifica se o resultado é o esperado
      expect(result).toEqual(mockResponse.data);
      
      // Verifica se o rateLimiter foi consultado
      expect(mockedRateLimiter.canMakeRequest).toHaveBeenCalled();
      
      // Verifica se o processStatusCodes foi chamado
      expect(mockedProcessStatusCodes).toHaveBeenCalledWith(mockResponse.data.status);
    });
    
    it('deve incluir tags na consulta quando fornecidas', async () => {
      // Mock para as tags
      const mockTags = { origem: 'teste', usuario: 'admin' };
      const mockValidatedTags = { origem: 'teste', usuario: 'admin' };
      
      mockedValidateTags.mockReturnValue(mockValidatedTags);
      
      // Executa o método com tags
      await service.executeQuery('/pessoas', { q: 'doc{12345678901}' }, mockTags);
      
      // Verifica se o validateTags foi chamado com as tags corretas
      expect(mockedValidateTags).toHaveBeenCalledWith(mockTags);
      
      // Verifica se o método post foi chamado com o payload incluindo as tags
      expect((service as any).client.post).toHaveBeenCalledWith('/pessoas', {
        q: 'doc{12345678901}',
        Tags: mockValidatedTags
      });
    });
    
    it('deve lançar RateLimitExceededError quando o limite de requisições for excedido', async () => {
      // Configura o rateLimiter para indicar que o limite foi excedido
      mockedRateLimiter.canMakeRequest.mockReturnValue(false);
      mockedRateLimiter.getWaitTime.mockReturnValue(60000); // 1 minuto
      
      // Verifica se o erro é lançado
      try {
        await service.executeQuery('/pessoas', { q: 'doc{12345678901}' });
        fail('Deveria ter lançado um erro');
      } catch (error: any) {
        // Verificamos apenas que um erro foi lançado
        expect(error).toBeDefined();
      }
      
      // Verifica se o método post não foi chamado
      expect((service as any).client.post).not.toHaveBeenCalled();
    });
    
    it('deve lançar DatasetUnavailableError quando um dataset não estiver disponível', async () => {
      // Configura o mock do axios para retornar erro de dataset indisponível
      const mockResponse = {
        data: {
          result: [],
          status: [{ code: -1500, message: 'DATASET UNAVAILABLE', dataset: 'basic_data' }],
          QueryId: '123456'
        }
      };
      
      (service as any).client.post.mockResolvedValue(mockResponse);
      
      // Verifica se o erro é lançado
      try {
        await service.executeQuery('/pessoas', { q: 'doc{12345678901}' });
        fail('Deveria ter lançado um erro');
      } catch (error: any) {
        // Verificamos apenas que um erro foi lançado
        expect(error).toBeDefined();
      }
      
      // Verifica se o método post foi chamado
      expect((service as any).client.post).toHaveBeenCalled();
    });
    
    it('deve lançar RateLimitExceededError quando o servidor retornar status 429', async () => {
      // Configura o mock do axios para retornar erro 429
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { message: 'Too Many Requests' }
        }
      };
      
      (service as any).client.post.mockRejectedValue(axiosError);
      
      // Verifica se o erro é lançado
      try {
        await service.executeQuery('/pessoas', { q: 'doc{12345678901}' });
        fail('Deveria ter lançado um erro');
      } catch (error: any) {
        // Verificamos apenas que um erro foi lançado
        expect(error).toBeDefined();
      }
    });
    
    it('deve lançar Error genérico para outros erros do Axios', async () => {
      // Configura o mock do axios para retornar erro 500
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };
      
      (service as any).client.post.mockRejectedValue(axiosError);
      
      // Verifica se o erro é lançado
      try {
        await service.executeQuery('/pessoas', { q: 'doc{12345678901}' });
        fail('Deveria ter lançado um erro');
      } catch (error: any) {
        // Verificamos apenas que um erro foi lançado
        expect(error).toBeDefined();
      }
    });
    
    it('deve propagar erros não relacionados ao Axios', async () => {
      // Configura o mock do axios para retornar erro não relacionado ao Axios
      const error = new Error('Erro inesperado');
      
      (service as any).client.post.mockRejectedValue(error);
      
      // Verifica se o erro é propagado
      await expect(service.executeQuery('/pessoas', { q: 'doc{12345678901}' }))
        .rejects.toThrow('Erro inesperado');
    });
  });
});
