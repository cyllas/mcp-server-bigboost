import * as utilsIndex from '../../../utils';
import * as errorHandler from '../../../utils/errorHandler';
import * as rateLimiter from '../../../utils/rateLimiter';
import * as tagValidator from '../../../utils/tagValidator';
import * as responseFormatter from '../../../utils/responseFormatter';

describe('Utils Index', () => {
  it('deve exportar todos os utilitários corretamente', () => {
    // Verifica se todas as exportações de errorHandler estão presentes no index
    Object.keys(errorHandler).forEach(key => {
      expect(utilsIndex).toHaveProperty(key);
      expect(utilsIndex[key]).toBe(errorHandler[key]);
    });

    // Verifica se todas as exportações de rateLimiter estão presentes no index
    Object.keys(rateLimiter).forEach(key => {
      expect(utilsIndex).toHaveProperty(key);
      expect(utilsIndex[key]).toBe(rateLimiter[key]);
    });

    // Verifica se todas as exportações de tagValidator estão presentes no index
    Object.keys(tagValidator).forEach(key => {
      expect(utilsIndex).toHaveProperty(key);
      expect(utilsIndex[key]).toBe(tagValidator[key]);
    });

    // Verifica se todas as exportações de responseFormatter estão presentes no index
    Object.keys(responseFormatter).forEach(key => {
      expect(utilsIndex).toHaveProperty(key);
      expect(utilsIndex[key]).toBe(responseFormatter[key]);
    });
  });
});
