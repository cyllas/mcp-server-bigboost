import { McpServer } from '../mcpServer';
import { registerConsultaPessoaTool } from './consultaPessoaTool';
import { registerConsultaEmpresaTool } from './consultaEmpresaTool';
import { registerConsultaQsaTool } from './consultaQsaTool';
import { registerConsultaRegistroEmpresaTool } from './consultaRegistroEmpresaTool';
import { registerConsultaPessoaTelefoneTool } from './consultaPessoaTelefoneTool';
import { registerConsultaPessoaEmailTool } from './consultaPessoaEmailTool';

/**
 * Registra todas as ferramentas no servidor MCP
 * @param server Instância do servidor MCP
 */
export function registerTools(server: McpServer): void {
  // Registra as ferramentas de consulta
  registerConsultaPessoaTool(server);
  registerConsultaEmpresaTool(server);
  registerConsultaQsaTool(server);
  registerConsultaRegistroEmpresaTool(server);
  registerConsultaPessoaTelefoneTool(server);
  registerConsultaPessoaEmailTool(server);
  
  console.log('Ferramentas registradas com sucesso');
}
