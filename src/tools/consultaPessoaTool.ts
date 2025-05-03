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
interface BigboostPessoaResponse {
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
}

/**
 * Esquema de validação para os parâmetros da consulta de pessoa
 */
const consultaPessoaSchema = {
  cpf: z.string()
    .min(11, 'CPF deve ter pelo menos 11 dígitos')
    .max(14, 'CPF não deve ter mais de 14 caracteres')
    .refine(
      (cpf) => /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(cpf),
      { message: 'Formato de CPF inválido' }
    )
};

/**
 * Registra a ferramenta de consulta de pessoa no servidor MCP
 * @param server Instância do servidor MCP
 */
export function registerConsultaPessoaTool(server: McpServer): void {
  registerTool(
    server,
    'consultaPessoa',
    'Consulta dados básicos de uma pessoa pelo CPF',
    consultaPessoaSchema,
    async (params) => {
      // Remove formatação do CPF (pontos e traços)
      const cpfLimpo = params.cpf.replace(/[^\d]/g, '');
      
      // Monta o payload da consulta
      const payload = {
        q: `doc{${cpfLimpo}}`,
        Datasets: "basic_data"
      };
      
      // Executa a consulta na API Bigboost
      const response = await bigboostService.executeQuery<BigboostPessoaResponse>(
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
        queryDate: responseAny.QueryDate
      };
    }
  );
}
