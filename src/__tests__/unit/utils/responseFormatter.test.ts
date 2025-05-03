import { formatResponse } from '../../../utils/responseFormatter';
import { BigboostResponseWithStatus } from '../../../types/errorTypes';

describe('responseFormatter', () => {
  it('deve formatar resposta corretamente', () => {
    const response: BigboostResponseWithStatus<any> = {
      result: { nome: 'João Silva', cpf: '123.456.789-00' },
      status: [{ code: 0, message: 'OK' }]
    };

    const result = formatResponse(response);
    
    expect(result.type).toBe('text');
    const parsedText = JSON.parse(result.text);
    expect(parsedText).toEqual(response);
  });

  it('deve formatar resposta com dados complexos', () => {
    const response: BigboostResponseWithStatus<any> = {
      result: {
        empresa: {
          nome: 'Empresa Teste LTDA',
          cnpj: '12.345.678/0001-90',
          socios: [
            { nome: 'João Silva', cpf: '123.456.789-00' },
            { nome: 'Maria Souza', cpf: '987.654.321-00' }
          ]
        }
      },
      status: [{ code: 0, message: 'OK' }]
    };

    const result = formatResponse(response);
    
    expect(result.type).toBe('text');
    const parsedText = JSON.parse(result.text);
    expect(parsedText).toEqual(response);
  });

  it('deve formatar resposta com status de erro', () => {
    const response: BigboostResponseWithStatus<any> = {
      result: null,
      status: [{ code: -101, message: 'Erro de validação' }]
    };

    const result = formatResponse(response);
    
    expect(result.type).toBe('text');
    const parsedText = JSON.parse(result.text);
    expect(parsedText).toEqual(response);
  });
});
