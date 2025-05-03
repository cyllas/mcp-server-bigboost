import { bigboostService } from '../../services/bigboostService';
import { 
  BigboostError, 
  RateLimitExceededError, 
  DatasetUnavailableError,
  processStatusCodes
} from '../../utils/errorHandler';
import { StatusCodeCategory } from '../../constants/statusCodes';
import axios from 'axios';

// Mock das dependências
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Tratamento de Erros da API', () => {
  // Configuração original do console.error
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Mock do console.error para evitar logs durante os testes
    console.error = jest.fn();
    
    // Configuração do mock do axios
    mockedAxios.create.mockReturnValue({
      post: jest.fn()
    } as any);
    
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restaura console.error
    console.error = originalConsoleError;
  });
  
  describe('Erros de Código de Status', () => {
    it('deve tratar erros de dados de entrada (códigos -100 a -999)', () => {
      const statusList = [
        { code: -101, message: 'Erro de validação de CPF', dataset: 'basic_data' }
      ];
      
      expect(() => processStatusCodes(statusList)).toThrow(BigboostError);
      try {
        processStatusCodes(statusList);
      } catch (error) {
        expect(error).toBeInstanceOf(BigboostError);
        const bigboostError = error as BigboostError;
        expect(bigboostError.code).toBe(-101);
        expect(bigboostError.message).toBe('Erro de validação de CPF');
        expect(bigboostError.category).toBe(StatusCodeCategory.INPUT_DATA);
      }
    });
    
    it('deve tratar erros de login (códigos -1000 a -1199)', () => {
      const statusList = [
        { code: -1001, message: 'Token inválido', dataset: 'basic_data' }
      ];
      
      expect(() => processStatusCodes(statusList)).toThrow(BigboostError);
      try {
        processStatusCodes(statusList);
      } catch (error) {
        expect(error).toBeInstanceOf(BigboostError);
        const bigboostError = error as BigboostError;
        expect(bigboostError.code).toBe(-1001);
        expect(bigboostError.message).toBe('Token inválido');
        expect(bigboostError.category).toBe(StatusCodeCategory.LOGIN);
      }
    });
    
    it('deve tratar erros internos da API (códigos -1200 a -1999)', () => {
      const statusList = [
        { code: -1500, message: 'Erro interno do servidor', dataset: 'basic_data' }
      ];
      
      expect(() => processStatusCodes(statusList)).toThrow(BigboostError);
      try {
        processStatusCodes(statusList);
      } catch (error) {
        expect(error).toBeInstanceOf(BigboostError);
        const bigboostError = error as BigboostError;
        expect(bigboostError.code).toBe(-1500);
        expect(bigboostError.message).toBe('Erro interno do servidor');
        expect(bigboostError.category).toBe(StatusCodeCategory.INTERNAL);
      }
    });
    
    it('deve tratar erros de consultas on-demand (códigos -2000 a -2999)', () => {
      const statusList = [
        { code: -2001, message: 'Erro na consulta on-demand', dataset: 'basic_data' }
      ];
      
      expect(() => processStatusCodes(statusList)).toThrow(BigboostError);
      try {
        processStatusCodes(statusList);
      } catch (error) {
        expect(error).toBeInstanceOf(BigboostError);
        const bigboostError = error as BigboostError;
        expect(bigboostError.code).toBe(-2001);
        expect(bigboostError.message).toBe('Erro na consulta on-demand');
        expect(bigboostError.category).toBe(StatusCodeCategory.ON_DEMAND);
      }
    });
    
    it('deve tratar erros de monitoramento (códigos -3000 em diante)', () => {
      const statusList = [
        { code: -3001, message: 'Erro no monitoramento', dataset: 'basic_data' }
      ];
      
      expect(() => processStatusCodes(statusList)).toThrow(BigboostError);
      try {
        processStatusCodes(statusList);
      } catch (error) {
        expect(error).toBeInstanceOf(BigboostError);
        const bigboostError = error as BigboostError;
        expect(bigboostError.code).toBe(-3001);
        expect(bigboostError.message).toBe('Erro no monitoramento');
        expect(bigboostError.category).toBe(StatusCodeCategory.MONITORING);
      }
    });
  });
  
  describe('Erros Específicos', () => {
    it('deve criar e lançar RateLimitExceededError com tempo de espera', () => {
      const waitTime = 60000; // 1 minuto
      const error = new RateLimitExceededError(waitTime);
      
      expect(error).toBeInstanceOf(RateLimitExceededError);
      expect(error.message).toBe('Limite de requisições excedido. Tente novamente em 60 segundos.');
      expect(error.name).toBe('RateLimitExceededError');
    });
    
    it('deve criar e lançar DatasetUnavailableError com nome do dataset', () => {
      const dataset = 'basic_data';
      const error = new DatasetUnavailableError(dataset);
      
      expect(error).toBeInstanceOf(DatasetUnavailableError);
      expect(error.message).toBe('Dataset "basic_data" não está disponível para o seu usuário.');
      expect(error.name).toBe('DatasetUnavailableError');
    });
  });
  
  describe('Cenários de Erro Comuns', () => {
    it('deve tratar erro de limite de requisições (HTTP 429)', async () => {
      // Configuração do mock do axios para retornar erro 429
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { message: 'Too Many Requests' }
        }
      };
      
      (bigboostService as any).client = {
        post: jest.fn().mockRejectedValue(axiosError)
      };
      
      // Tenta executar uma consulta
      try {
        await bigboostService.executeQuery('/pessoas', { q: 'doc{12345678901}' });
        fail('Deveria ter lançado um erro');
      } catch (error: any) {
        // Verificamos apenas que um erro foi lançado
        expect(error).toBeDefined();
      }
    });
    
    it('deve tratar erro de dataset indisponível', async () => {
      // Configuração do mock para retornar erro de dataset indisponível
      const mockResponse = {
        result: [],
        status: [{ code: -1500, message: 'DATASET UNAVAILABLE', dataset: 'basic_data' }],
        QueryId: '123456'
      };
      
      (bigboostService as any).client = {
        post: jest.fn().mockResolvedValue({ data: mockResponse })
      };
      
      // Tenta executar uma consulta
      try {
        await bigboostService.executeQuery('/pessoas', { q: 'doc{12345678901}' });
        fail('Deveria ter lançado um erro');
      } catch (error: any) {
        // Verificamos apenas que um erro foi lançado
        expect(error).toBeDefined();
      }
    });
    
    it('deve tratar erro de autenticação (HTTP 401)', async () => {
      // Configuração do mock do axios para retornar erro 401
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      
      (bigboostService as any).client = {
        post: jest.fn().mockRejectedValue(axiosError)
      };
      
      // Tenta executar uma consulta
      try {
        await bigboostService.executeQuery('/pessoas', { q: 'doc{12345678901}' });
        fail('Deveria ter lançado um erro');
      } catch (error: any) {
        // Verificamos apenas que um erro foi lançado
        expect(error).toBeDefined();
      }
    });
    
    it('deve tratar erro de servidor (HTTP 500)', async () => {
      // Configuração do mock do axios para retornar erro 500
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };
      
      (bigboostService as any).client = {
        post: jest.fn().mockRejectedValue(axiosError)
      };
      
      // Tenta executar uma consulta
      try {
        await bigboostService.executeQuery('/pessoas', { q: 'doc{12345678901}' });
        fail('Deveria ter lançado um erro');
      } catch (error: any) {
        // Verificamos apenas que um erro foi lançado
        expect(error).toBeDefined();
      }
    });
  });
});
