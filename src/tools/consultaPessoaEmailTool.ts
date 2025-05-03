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
interface BigboostPessoaEmailResponse {
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
 * Esquema de validação para os parâmetros da consulta de pessoa por email
 */
const consultaPessoaEmailSchema = {
  email: z.string()
    .email('Formato de email inválido')
    .min(5, 'Email deve ter pelo menos 5 caracteres')
    .max(254, 'Email não deve ter mais de 254 caracteres')
};

/**
 * Registra a ferramenta de consulta de pessoa por email no servidor MCP
 * @param server Instância do servidor MCP
 */
export function registerConsultaPessoaEmailTool(server: McpServer): void {
  registerTool(
    server,
    'consultaPessoaEmail',
    'Consulta dados básicos de uma pessoa pelo endereço de email',
    consultaPessoaEmailSchema,
    async (params) => {
      // Monta o payload da consulta
      const payload = {
        q: `email{${params.email}}`,
        Datasets: "basic_data"
      };
      
      // Executa a consulta na API Bigboost
      const response = await bigboostService.executeQuery<BigboostPessoaEmailResponse>(
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
