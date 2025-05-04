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
    
    try {
      switch (name) {
        case 'consultaPessoa':
          return await handleConsultaPessoa(args);
        case 'consultaEmpresa':
          return await handleConsultaEmpresa(args);
        case 'consultaQsa':
          return await handleConsultaQsa(args);
        case 'consultaRegistroEmpresa':
          return await handleConsultaRegistroEmpresa(args);
        case 'consultaPessoaTelefone':
          return await handleConsultaPessoaTelefone(args);
        case 'consultaPessoaEmail':
          return await handleConsultaPessoaEmail(args);
        default:
          throw new Error(`Ferramenta desconhecida: ${name}`);
      }
    } catch (error) {
      console.error(`Erro ao executar a ferramenta ${name}:`, error);
      return {
        content: [formatErrorResponse(error)]
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
  const validatedArgs = consultaPessoaSchema.parse(args);
  const cpfLimpo = validatedArgs.cpf.replace(/[^\d]/g, '');
  
  try {
    const response = await bigboostService.executeQuery(
      '/pessoas',
      {
        q: `doc{${cpfLimpo}}`,
        Datasets: "basic_data"
      }
    );
    
    return {
      content: [formatResponse(response)]
    };
  } catch (error: any) {
    console.error(`Erro ao executar a ferramenta consultaPessoa:`, error);
    throw error;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta de empresa por CNPJ
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaEmpresa(args: any) {
  const validatedArgs = consultaEmpresaSchema.parse(args);
  const cnpjLimpo = validatedArgs.cnpj.replace(/[^\d]/g, '');
  
  try {
    const response = await bigboostService.executeQuery(
      '/empresas',
      {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "basic_data"
      }
    );
    
    return {
      content: [formatResponse(response)]
    };
  } catch (error: any) {
    console.error(`Erro ao executar a ferramenta consultaEmpresa:`, error);
    throw error;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta do Quadro de Sócios e Administradores de uma empresa pelo CNPJ
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaQsa(args: any) {
  const validatedArgs = consultaQsaSchema.parse(args);
  const cnpjLimpo = validatedArgs.cnpj.replace(/[^\d]/g, '');
  
  try {
    const response = await bigboostService.executeQuery(
      '/empresas',
      {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "qsa"
      }
    );
    
    return {
      content: [formatResponse(response)]
    };
  } catch (error: any) {
    console.error(`Erro ao executar a ferramenta consultaQsa:`, error);
    throw error;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta de registros detalhados de uma empresa pelo CNPJ
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaRegistroEmpresa(args: any) {
  const validatedArgs = consultaRegistroEmpresaSchema.parse(args);
  const cnpjLimpo = validatedArgs.cnpj.replace(/[^\d]/g, '');
  
  try {
    const response = await bigboostService.executeQuery(
      '/empresas',
      {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "registration"
      }
    );
    
    return {
      content: [formatResponse(response)]
    };
  } catch (error: any) {
    console.error(`Erro ao executar a ferramenta consultaRegistroEmpresa:`, error);
    throw error;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta de pessoa por número de telefone
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaPessoaTelefone(args: any) {
  const validatedArgs = consultaPessoaTelefoneSchema.parse(args);
  const telefoneLimpo = validatedArgs.telefone.replace(/[^\d]/g, '');
  
  try {
    const response = await bigboostService.executeQuery(
      '/pessoas',
      {
        q: `phone{${telefoneLimpo}}`,
        Datasets: "basic_data"
      }
    );
    
    return {
      content: [formatResponse(response)]
    };
  } catch (error: any) {
    console.error(`Erro ao executar a ferramenta consultaPessoaTelefone:`, error);
    throw error;
  }
}

/**
 * Manipula a chamada da ferramenta de consulta de pessoa por endereço de email
 * @param args Argumentos da chamada
 * @returns Resposta formatada para o MCP
 */
async function handleConsultaPessoaEmail(args: any) {
  const validatedArgs = consultaPessoaEmailSchema.parse(args);
  
  try {
    const response = await bigboostService.executeQuery(
      '/pessoas',
      {
        q: `email{${validatedArgs.email}}`,
        Datasets: "basic_data"
      }
    );
    
    return {
      content: [formatResponse(response)]
    };
  } catch (error: any) {
    console.error(`Erro ao executar a ferramenta consultaPessoaEmail:`, error);
    throw error;
  }
}
