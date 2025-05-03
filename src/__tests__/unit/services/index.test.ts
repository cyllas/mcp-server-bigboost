import * as servicesIndex from '../../../services';
import * as bigboostService from '../../../services/bigboostService';

describe('Services Index', () => {
  it('deve exportar todos os serviços corretamente', () => {
    // Verifica se todas as exportações de bigboostService estão presentes no index
    Object.keys(bigboostService).forEach(key => {
      expect(servicesIndex).toHaveProperty(key);
      expect(servicesIndex[key]).toBe(bigboostService[key]);
    });
  });
});
