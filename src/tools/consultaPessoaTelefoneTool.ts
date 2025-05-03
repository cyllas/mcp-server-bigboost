import { z } from 'zod';
import { registerTool } from './baseTools';
import { McpServer } from '../mcpServer.js';
import { bigboostService } from '../services/bigboostService';
import { BigboostResponseWithStatus } from '../types/errorTypes';

/**
 * Interface para os dados básicos de uma pessoa
 */
interface PessoaBasicData {
  TaxIdNumber?: string; // CPF
  Name?: string; // Nome completo
  BirthDate?: string; // Data de nascimento
  Gender?: string; // Sexo
  MotherName?: string; // Nome da mãe
  TaxIdStatus?: string; // Situação do CPF
  TaxIdOrigin?: string; // Origem do CPF
  TaxIdFiscalRegion?: string; // Região fiscal
  Age?: number; // Idade
  MaritalStatusData?: {
    MaritalStatus?: string; // Estado civil
  };
}

/**
 * Interface para a resposta da API Bigboost
 */
interface BigboostPessoaTelefoneResponse {
  Result?: Array<{
    MatchKeys?: string;
    BasicData?: PessoaBasicData;
  }>;
  Status?: Record<string, Array<{
    Code: number;
    Message: string;
  }>>;
  QueryId?: string;
  ElapsedMilliseconds?: number;
  QueryDate?: string;
  Evidences?: Record<string, any>;
}

/**
 * Esquema de validação para os parâmetros da consulta de pessoa por telefone
 */
const consultaPessoaTelefoneSchema = {
  telefone: z.string()
    .min(8, 'Telefone deve ter pelo menos 8 dígitos')
    .max(20, 'Telefone não deve ter mais de 20 caracteres')
    .refine(
      (telefone) => /^(\+\d{1,3})?[\s.-]?\(?\d{1,3}\)?[\s.-]?\d{3,5}[\s.-]?\d{4}$/.test(telefone),
      { message: 'Formato de telefone inválido' }
    )
};

/**
 * Função para limpar o número de telefone, removendo caracteres não numéricos
 * @param telefone Número de telefone a ser limpo
 * @returns Número de telefone limpo, apenas com dígitos
 */
function limparTelefone(telefone: string): string {
  return telefone.replace(/\D/g, '');
}

/**
 * Registra a ferramenta de consulta de pessoa por telefone no servidor MCP
 * @param server Instância do servidor MCP
 */
export function registerConsultaPessoaTelefoneTool(server: McpServer): void {
  registerTool(
    server,
    'consultaPessoaTelefone',
    'Consulta dados básicos de uma pessoa pelo número de telefone',
    consultaPessoaTelefoneSchema,
    async (params) => {
      // Remove formatação do telefone (parênteses, traços, espaços)
      const telefoneLimpo = limparTelefone(params.telefone);
      
      // Monta o payload da consulta
      const payload = {
        q: `phone{${telefoneLimpo}}`,
        Datasets: "basic_data"
      };
      
      // Executa a consulta na API Bigboost
      const response = await bigboostService.executeQuery<BigboostPessoaTelefoneResponse>(
        '/pessoas',
        payload
      );
      
      // Obtém a resposta bruta da API
      const responseAny = response as any;
      
      // Retorna os dados exatamente como vêm da API
      return {
        result: responseAny.Result || [],
        status: responseAny.Status || {},
        queryId: responseAny.QueryId,
        elapsedMilliseconds: responseAny.ElapsedMilliseconds,
        queryDate: responseAny.QueryDate,
        evidences: responseAny.Evidences || {}
      };
    }
  );
}
