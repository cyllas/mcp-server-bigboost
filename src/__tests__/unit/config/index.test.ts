import * as configIndex from '../../../config';
import * as auth from '../../../config/auth';
import * as rateLimit from '../../../config/rateLimit';

describe('Config Index', () => {
  it('deve exportar todas as configurações corretamente', () => {
    // Verifica se todas as exportações de auth estão presentes no index
    Object.keys(auth).forEach(key => {
      expect(configIndex).toHaveProperty(key);
      expect(configIndex[key]).toBe(auth[key]);
    });

    // Verifica se todas as exportações de rateLimit estão presentes no index
    Object.keys(rateLimit).forEach(key => {
      expect(configIndex).toHaveProperty(key);
      expect(configIndex[key]).toBe(rateLimit[key]);
    });
  });
});
