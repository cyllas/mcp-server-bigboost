import * as constantsIndex from '../../../constants';
import * as statusCodes from '../../../constants/statusCodes';
import * as queryParams from '../../../constants/queryParams';

describe('Constants Index', () => {
  it('deve exportar todas as constantes corretamente', () => {
    // Verifica se todas as exportações de statusCodes estão presentes no index
    Object.keys(statusCodes).forEach(key => {
      expect(constantsIndex).toHaveProperty(key);
      expect(constantsIndex[key]).toBe(statusCodes[key]);
    });

    // Verifica se todas as exportações de queryParams estão presentes no index
    Object.keys(queryParams).forEach(key => {
      expect(constantsIndex).toHaveProperty(key);
      expect(constantsIndex[key]).toBe(queryParams[key]);
    });
  });
});
