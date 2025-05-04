import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { bigboostService } from '../services/bigboostService';
import { formatResponse } from '../utils/responseFormatter';
import { formatErrorResponse } from '../utils/errorHandler';
import { CallToolRequestSchema, ListToolsRequestSchema } from '../mcpServer';



// Esquemas de validação para os parâmetros das ferramentas
const consultaPessoaSchema = z.object({
  cpf: z.string()
    .min(11, 'CPF deve ter pelo menos 11 dígitos')
    .max(14, 'CPF não deve ter mais de 14 caracteres')
    .refine(
      (cpf) => /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(cpf),
      { message: 'Formato de CPF inválido' }
    )
});

const consultaEmpresaSchema = z.object({
  cnpj: z.string()
    .min(14, 'CNPJ deve ter pelo menos 14 dígitos')
    .max(18, 'CNPJ não deve ter mais de 18 caracteres')
    .refine(
      (cnpj) => /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(cnpj),
      { message: 'Formato de CNPJ inválido' }
    )
});

const consultaQsaSchema = z.object({
  cnpj: z.string()
    .min(14, 'CNPJ deve ter pelo menos 14 dígitos')
    .max(18, 'CNPJ não deve ter mais de 18 caracteres')
    .refine(
      (cnpj) => /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(cnpj),
      { message: 'Formato de CNPJ inválido' }
    )
});

const consultaRegistroEmpresaSchema = z.object({
  cnpj: z.string()
    .min(14, 'CNPJ deve ter pelo menos 14 dígitos')
    .max(18, 'CNPJ não deve ter mais de 18 caracteres')
    .refine(
      (cnpj) => /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(cnpj),
      { message: 'Formato de CNPJ inválido' }
    )
});

const consultaPessoaTelefoneSchema = z.object({
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone não deve ter mais de 15 caracteres')
    .refine(
      (telefone) => /^\+?\d{2}?\s?\(?\d{2}\)?\s?\d{4,5}\-?\d{4}$/.test(telefone),
      { message: 'Formato de telefone inválido' }
    )
});

const consultaPessoaEmailSchema = z.object({
  email: z.string()
    .email('Formato de email inválido')
});

/**
 * Registra todas as ferramentas no servidor MCP
 * @param server Instância do servidor MCP
 */
export function registerTools(server: any): void {
  // Registrar o handler para chamadas de ferramentas
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params;
    const requestId = request.id || 'unknown';
    
    // Importar logger de forma dinâmica para evitar dependência circular
    const { info, error: logError } = await import('../utils/logger');
    
    info('Tool', `Chamada para ferramenta: ${name}`, { requestId, args });
    
    try {
      let result;
      switch (name) {
        case 'consultaPessoa':
          result = await handleConsultaPessoa(args);
          break;
        case 'consultaEmpresa':
          result = await handleConsultaEmpresa(args);
          break;
        case 'consultaQsa':
          result = await handleConsultaQsa(args);
          break;
        case 'consultaRegistroEmpresa':
          result = await handleConsultaRegistroEmpresa(args);
          break;
        case 'consultaPessoaTelefone':
          result = await handleConsultaPessoaTelefone(args);
          break;
        case 'consultaPessoaEmail':
          result = await handleConsultaPessoaEmail(args);
          break;
        default:
          throw new Error(`Ferramenta desconhecida: ${name}`);
      }
      
      info('Tool', `Ferramenta ${name} executada com sucesso`, { requestId });
      return result;
    } catch (err) {
      logError('Tool', `Erro ao executar a ferramenta ${name}`, { requestId, error: err });
      return {
        content: [formatErrorResponse(err)]
      };
    }
  });
  
  // Registrar a lista de ferramentas disponíveis
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "consultaPessoa",
          description: "Consulta dados básicos de uma pessoa pelo CPF",
          inputSchema: zodToJsonSchema(consultaPessoaSchema)
        },
        {
          name: "consultaEmpresa",
          description: "Consulta dados básicos de uma empresa pelo CNPJ",
          inputSchema: zodToJsonSchema(consultaEmpresaSchema)
        },
        {
          name: "consultaQsa",
          description: "Consulta o Quadro de Sócios e Administradores de uma empresa pelo CNPJ",
          inputSchema: zodToJsonSchema(consultaQsaSchema)
        },
        {
          name: "consultaRegistroEmpresa",
          description: "Consulta registros detalhados de uma empresa pelo CNPJ",
          inputSchema: zodToJsonSchema(consultaRegistroEmpresaSchema)
        },
        {
          name: "consultaPessoaTelefone",
          description: "Consulta dados de uma pessoa pelo número de telefone",
          inputSchema: zodToJsonSchema(consultaPessoaTelefoneSchema)
        },
        {
          name: "consultaPessoaEmail",
          description: "Consulta dados de uma pessoa pelo endereço de email",
          inputSchema: zodToJsonSchema(consultaPessoaEmailSchema)
        }
      ]
    };
  });
  
  console.log('Ferramentas registradas com sucesso');
}

/**
 * Manipula a chamada da ferramenta de consulta de pessoa por CPF
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaPessoa(args: any) {
  // Importar logger de forma dinâmica para evitar dependência circular
  const { debug, error: logError } = await import('../utils/logger');
  
  debug('ConsultaPessoa', 'Validando argumentos', { args });
  const validatedArgs = consultaPessoaSchema.parse(args);
  const cpfLimpo = validatedArgs.cpf.replace(/[^\d]/g, '');
  
  debug('ConsultaPessoa', 'CPF formatado', { cpf: validatedArgs.cpf, cpfLimpo });
  
  try {
    debug('ConsultaPessoa', 'Executando consulta na API Bigboost');
    const response = await bigboostService.executeQuery(
      '/pessoas',
      {
        q: `doc{${cpfLimpo}}`,
        Datasets: "basic_data"
      }
    );
    
    debug('ConsultaPessoa', 'Consulta executada com sucesso');
    return {
      content: [formatResponse(response)]
    };
  } catch (err: any) {
    logError('ConsultaPessoa', `Erro ao executar consulta`, { error: err });
    throw err;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta de empresa por CNPJ
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaEmpresa(args: any) {
  // Importar logger de forma dinâmica para evitar dependência circular
  const { debug, error: logError } = await import('../utils/logger');
  
  debug('ConsultaEmpresa', 'Validando argumentos', { args });
  const validatedArgs = consultaEmpresaSchema.parse(args);
  const cnpjLimpo = validatedArgs.cnpj.replace(/[^\d]/g, '');
  
  debug('ConsultaEmpresa', 'CNPJ formatado', { cnpj: validatedArgs.cnpj, cnpjLimpo });
  
  try {
    debug('ConsultaEmpresa', 'Executando consulta na API Bigboost');
    const response = await bigboostService.executeQuery(
      '/empresas',
      {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "basic_data"
      }
    );
    
    debug('ConsultaEmpresa', 'Consulta executada com sucesso');
    return {
      content: [formatResponse(response)]
    };
  } catch (err: any) {
    logError('ConsultaEmpresa', `Erro ao executar consulta`, { error: err });
    throw err;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta do Quadro de Sócios e Administradores de uma empresa pelo CNPJ
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaQsa(args: any) {
  // Importar logger de forma dinâmica para evitar dependência circular
  const { debug, error: logError } = await import('../utils/logger');
  
  debug('ConsultaQsa', 'Validando argumentos', { args });
  const validatedArgs = consultaQsaSchema.parse(args);
  const cnpjLimpo = validatedArgs.cnpj.replace(/[^\d]/g, '');
  
  debug('ConsultaQsa', 'CNPJ formatado', { cnpj: validatedArgs.cnpj, cnpjLimpo });
  
  try {
    debug('ConsultaQsa', 'Executando consulta na API Bigboost');
    const response = await bigboostService.executeQuery(
      '/empresas',
      {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "qsa"
      }
    );
    
    debug('ConsultaQsa', 'Consulta executada com sucesso');
    return {
      content: [formatResponse(response)]
    };
  } catch (err: any) {
    logError('ConsultaQsa', `Erro ao executar consulta`, { error: err });
    throw err;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta de registros detalhados de uma empresa pelo CNPJ
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaRegistroEmpresa(args: any) {
  // Importar logger de forma dinâmica para evitar dependência circular
  const { debug, error: logError } = await import('../utils/logger');
  
  debug('ConsultaRegistroEmpresa', 'Validando argumentos', { args });
  const validatedArgs = consultaRegistroEmpresaSchema.parse(args);
  const cnpjLimpo = validatedArgs.cnpj.replace(/[^\d]/g, '');
  
  debug('ConsultaRegistroEmpresa', 'CNPJ formatado', { cnpj: validatedArgs.cnpj, cnpjLimpo });
  
  try {
    debug('ConsultaRegistroEmpresa', 'Executando consulta na API Bigboost');
    const response = await bigboostService.executeQuery(
      '/empresas',
      {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "registration"
      }
    );
    
    debug('ConsultaRegistroEmpresa', 'Consulta executada com sucesso');
    return {
      content: [formatResponse(response)]
    };
  } catch (err: any) {
    logError('ConsultaRegistroEmpresa', `Erro ao executar consulta`, { error: err });
    throw err;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta de pessoa por número de telefone
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaPessoaTelefone(args: any) {
  // Importar logger de forma dinâmica para evitar dependência circular
  const { debug, error: logError } = await import('../utils/logger');
  
  debug('ConsultaPessoaTelefone', 'Validando argumentos', { args });
  const validatedArgs = consultaPessoaTelefoneSchema.parse(args);
  const telefoneLimpo = validatedArgs.telefone.replace(/[^\d]/g, '');
  
  debug('ConsultaPessoaTelefone', 'Telefone formatado', { telefone: validatedArgs.telefone, telefoneLimpo });
  
  try {
    debug('ConsultaPessoaTelefone', 'Executando consulta na API Bigboost');
    const response = await bigboostService.executeQuery(
      '/pessoas',
      {
        q: `phone{${telefoneLimpo}}`,
        Datasets: "basic_data"
      }
    );
    
    debug('ConsultaPessoaTelefone', 'Consulta executada com sucesso');
    return {
      content: [formatResponse(response)]
    };
  } catch (err: any) {
    logError('ConsultaPessoaTelefone', `Erro ao executar consulta`, { error: err });
    throw err;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta de pessoa por endereço de email
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaPessoaEmail(args: any) {
  // Importar logger de forma dinâmica para evitar dependência circular
  const { debug, error: logError } = await import('../utils/logger');
  
  debug('ConsultaPessoaEmail', 'Validando argumentos', { args });
  const validatedArgs = consultaPessoaEmailSchema.parse(args);
  
  debug('ConsultaPessoaEmail', 'Email validado', { email: validatedArgs.email });
  
  try {
    debug('ConsultaPessoaEmail', 'Executando consulta na API Bigboost');
    const response = await bigboostService.executeQuery(
      '/pessoas',
      {
        q: `email{${validatedArgs.email}}`,
        Datasets: "basic_data"
      }
    );
    
    debug('ConsultaPessoaEmail', 'Consulta executada com sucesso');
    return {
      content: [formatResponse(response)]
    };
  } catch (err: any) {
    logError('ConsultaPessoaEmail', `Erro ao executar consulta`, { error: err });
    throw err;
  }
}
