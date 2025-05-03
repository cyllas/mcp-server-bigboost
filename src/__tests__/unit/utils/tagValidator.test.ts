import { validateTags } from '../../../utils/tagValidator';
import { tagsSchema } from '../../../types/tagTypes';

// Mock do schema de tags
jest.mock('../../../types/tagTypes', () => ({
  tagsSchema: {
    parse: jest.fn((tags) => {
      // Simula a validação do schema
      // Se houver uma tag 'invalid', lança um erro
      if (tags.invalid) {
        throw new Error('Tag inválida');
      }
      return tags;
    })
  }
}));

describe('tagValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve validar tags corretamente', () => {
    const tags = {
      source: 'mcp',
      user: 'test'
    };

    const result = validateTags(tags);
    
    expect(result).toEqual(tags);
    expect(tagsSchema.parse).toHaveBeenCalledWith(tags);
  });

  it('deve propagar erros de validação', () => {
    const tags = {
      invalid: 'value'
    };

    expect(() => validateTags(tags)).toThrow('Tag inválida');
    expect(tagsSchema.parse).toHaveBeenCalledWith(tags);
  });
});
