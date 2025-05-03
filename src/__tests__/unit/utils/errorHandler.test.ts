import { 
  BigboostError, 
  RateLimitExceededError, 
  DatasetUnavailableError,
  processStatusCodes,
  formatErrorResponse
} from '../../../utils/errorHandler';
import { StatusCodeCategory } from '../../../constants/statusCodes';
import { BigboostStatus } from '../../../types/errorTypes';

// Mock das dependências
jest.mock('../../../constants/statusCodes', () => ({
  StatusCodeCategory: {
    INPUT_DATA: 'INPUT_DATA',
    LOGIN: 'LOGIN',
    API_INTERNAL: 'API_INTERNAL',
    ON_DEMAND: 'ON_DEMAND',
    MONITORING: 'MONITORING'
  },
  getStatusCodeCategory: jest.fn((code: number) => {
    if (code >= -100 && code <= -999) return 'INPUT_DATA';
    if (code >= -1000 && code <= -1199) return 'LOGIN';
    if (code >= -1200 && code <= -1999) return 'API_INTERNAL';
    if (code >= -2000 && code <= -2999) return 'ON_DEMAND';
    return 'MONITORING';
  }),
  isErrorStatusCode: jest.fn((code: number) => code < 0)
}));

describe('errorHandler', () => {
  describe('BigboostError', () => {
    it('deve criar um erro com código, mensagem e categoria', () => {
      const error = new BigboostError(-101, 'Erro de validação', StatusCodeCategory.INPUT_DATA);
      
      expect(error.code).toBe(-101);
      expect(error.message).toBe('Erro de validação');
      expect(error.category).toBe(StatusCodeCategory.INPUT_DATA);
      expect(error.name).toBe('BigboostError');
    });
  });
  
  describe('RateLimitExceededError', () => {
    it('deve criar um erro com mensagem formatada com o tempo de espera', () => {
      const error = new RateLimitExceededError(60000); // 1 minuto
      
      expect(error.message).toBe('Limite de requisições excedido. Tente novamente em 60 segundos.');
      expect(error.name).toBe('RateLimitExceededError');
    });
    
    it('deve arredondar o tempo de espera para cima', () => {
      const error = new RateLimitExceededError(30500); // 30.5 segundos
      
      expect(error.message).toBe('Limite de requisições excedido. Tente novamente em 31 segundos.');
    });
  });
  
  describe('DatasetUnavailableError', () => {
    it('deve criar um erro com mensagem formatada com o nome do dataset', () => {
      const error = new DatasetUnavailableError('basic_data');
      
      expect(error.message).toBe('Dataset "basic_data" não está disponível para o seu usuário.');
      expect(error.name).toBe('DatasetUnavailableError');
    });
  });
  
  describe('processStatusCodes', () => {
    it('não deve fazer nada se a lista de status for vazia', () => {
      expect(() => processStatusCodes([])).not.toThrow();
    });
    
    it('não deve fazer nada se a lista de status for undefined', () => {
      expect(() => processStatusCodes(undefined as unknown as BigboostStatus[])).not.toThrow();
    });
    
    it('não deve fazer nada se não houver códigos de erro', () => {
      const status: BigboostStatus[] = [
        { code: 0, message: 'OK' },
        { code: 1, message: 'Sucesso parcial' }
      ];
      
      expect(() => processStatusCodes(status)).not.toThrow();
    });
    
    it('deve lançar BigboostError se houver código de erro', () => {
      const status: BigboostStatus[] = [
        { code: 0, message: 'OK' },
        { code: -101, message: 'Erro de validação', dataset: 'basic_data' }
      ];
      
      expect(() => processStatusCodes(status)).toThrow(BigboostError);
      expect(() => processStatusCodes(status)).toThrow('Erro de validação');
    });
  });
  
  describe('formatErrorResponse', () => {
    it('deve formatar BigboostError corretamente', () => {
      const error = new BigboostError(-101, 'Erro de validação', StatusCodeCategory.INPUT_DATA);
      const formatted = formatErrorResponse(error);
      
      expect(formatted.type).toBe('text');
      const parsedText = JSON.parse(formatted.text);
      expect(parsedText.error.code).toBe(-101);
      expect(parsedText.error.message).toBe('Erro de validação');
      expect(parsedText.error.category).toBe(StatusCodeCategory.INPUT_DATA);
    });
    
    it('deve formatar RateLimitExceededError corretamente', () => {
      const error = new RateLimitExceededError(60000);
      const formatted = formatErrorResponse(error);
      
      expect(formatted.type).toBe('text');
      const parsedText = JSON.parse(formatted.text);
      expect(parsedText.error.message).toBe('Limite de requisições excedido. Tente novamente em 60 segundos.');
    });
    
    it('deve formatar DatasetUnavailableError corretamente', () => {
      const error = new DatasetUnavailableError('basic_data');
      const formatted = formatErrorResponse(error);
      
      expect(formatted.type).toBe('text');
      const parsedText = JSON.parse(formatted.text);
      expect(parsedText.error.message).toBe('Dataset "basic_data" não está disponível para o seu usuário.');
    });
    
    it('deve formatar Error genérico corretamente', () => {
      const error = new Error('Erro genérico');
      const formatted = formatErrorResponse(error);
      
      expect(formatted.type).toBe('text');
      const parsedText = JSON.parse(formatted.text);
      expect(parsedText.error.message).toBe('Erro genérico');
    });
    
    it('deve formatar erro desconhecido corretamente', () => {
      const error = 'Não é um objeto de erro';
      const formatted = formatErrorResponse(error);
      
      expect(formatted.type).toBe('text');
      const parsedText = JSON.parse(formatted.text);
      expect(parsedText.error.message).toBe('Erro desconhecido');
    });
  });
});
