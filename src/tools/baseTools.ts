import { McpServer } from '../mcpServer';
import { formatErrorResponse } from '../utils/errorHandler';
import { formatResponse } from '../utils/responseFormatter';

/**
 * Função auxiliar para registrar uma ferramenta no servidor MCP
 * @param server Instância do servidor MCP
 * @param name Nome da ferramenta
 * @param description Descrição da ferramenta
 * @param schema Esquema de validação dos parâmetros
 * @param handler Função que implementa a ferramenta
 */
export function registerTool<T extends Record<string, any>>(
  server: McpServer,
  name: string,
  description: string,
  schema: Record<string, any>,
  handler: (params: T) => Promise<any>
): void {
  server.tool(
    name,
    schema,
    async (params: T) => {
      try {
        const result = await handler(params);
        return {
          content: [formatResponse(result)]
        };
      } catch (error: any) {
        console.error(`Erro ao executar a ferramenta ${name}:`, error);
        return {
          content: [formatErrorResponse(error)]
        };
      }
    },
    { description }
  );
}
