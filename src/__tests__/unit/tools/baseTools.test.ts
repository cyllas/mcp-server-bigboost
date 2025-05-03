import { registerTool } from '../../../tools/baseTools';
import { formatResponse } from '../../../utils/responseFormatter';
import { formatErrorResponse } from '../../../utils/errorHandler';

// Mock das dependências
jest.mock('../../../utils/responseFormatter', () => ({
  formatResponse: jest.fn(result => ({ type: 'text', text: JSON.stringify(result) }))
}));

jest.mock('../../../utils/errorHandler', () => ({
  formatErrorResponse: jest.fn(error => ({ type: 'text', text: JSON.stringify({ error: error.message }) }))
}));

describe('baseTools', () => {
  describe('registerTool', () => {
    // Mock do servidor MCP
    const mockServer = {
      tool: jest.fn()
    };

    // Reset dos mocks antes de cada teste
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve registrar uma ferramenta no servidor MCP', () => {
      // Parâmetros de teste
      const name = 'testeTool';
      const description = 'Ferramenta de teste';
      const schema = { param: { type: 'string' } };
      const handler = jest.fn().mockResolvedValue({ resultado: 'sucesso' });

      // Executa a função
      registerTool(mockServer as any, name, description, schema, handler);

      // Verifica se o método tool do servidor foi chamado com os parâmetros corretos
      expect(mockServer.tool).toHaveBeenCalledWith(
        name,
        schema,
        expect.any(Function),
        { description }
      );

      // Obtém a função de callback passada para o servidor
      const callback = mockServer.tool.mock.calls[0][2];

      // Testa o callback com um caso de sucesso
      const params = { param: 'valor' };
      return callback(params).then((result: any) => {
        // Verifica se o handler foi chamado com os parâmetros corretos
        expect(handler).toHaveBeenCalledWith(params);
        
        // Verifica se o formatResponse foi chamado com o resultado do handler
        expect(formatResponse).toHaveBeenCalledWith({ resultado: 'sucesso' });
        
        // Verifica se o resultado está no formato esperado
        expect(result).toEqual({
          content: [{ type: 'text', text: JSON.stringify({ resultado: 'sucesso' }) }]
        });
      });
    });

    it('deve tratar erros lançados pelo handler', () => {
      // Configura o handler para lançar um erro
      const error = new Error('Erro de teste');
      const handler = jest.fn().mockRejectedValue(error);

      // Registra a ferramenta
      registerTool(mockServer as any, 'testeTool', 'Descrição', {}, handler);

      // Obtém a função de callback
      const callback = mockServer.tool.mock.calls[0][2];

      // Mock do console.error para evitar logs durante o teste
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Testa o callback com um caso de erro
      return callback({}).then((result: any) => {
        // Verifica se o erro foi logado
        expect(console.error).toHaveBeenCalledWith(
          'Erro ao executar a ferramenta testeTool:',
          error
        );
        
        // Verifica se o formatErrorResponse foi chamado com o erro
        expect(formatErrorResponse).toHaveBeenCalledWith(error);
        
        // Verifica se o resultado está no formato esperado
        expect(result).toEqual({
          content: [{ type: 'text', text: JSON.stringify({ error: 'Erro de teste' }) }]
        });

        // Restaura console.error
        console.error = originalConsoleError;
      });
    });
  });
});
