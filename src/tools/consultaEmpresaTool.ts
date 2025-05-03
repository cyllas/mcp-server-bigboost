import { z } from 'zod';
import { registerTool } from './baseTools';
import { McpServer } from '../mcpServer.js';
import { bigboostService } from '../services/bigboostService';
import { BigboostResponseWithStatus } from '../types/errorTypes';

/**
 * Interface para os dados básicos de uma empresa
 */
interface EmpresaBasicData {
  TaxIdNumber?: string; // CNPJ
  Name?: string; // Razão social
  TradeName?: string; // Nome fantasia
  TaxIdStatus?: string; // Situação do CNPJ
  FoundationDate?: string; // Data de fundação
  LegalNature?: string; // Natureza jurídica
  Size?: string; // Porte da empresa
  Address?: {
    Street?: string; // Logradouro
    Number?: string; // Número
    Complement?: string; // Complemento
    Neighborhood?: string; // Bairro
    ZipCode?: string; // CEP
    City?: string; // Cidade
    State?: string; // Estado
    Country?: string; // País
  };
  // Outros campos que podem estar presentes na resposta
}

/**
 * Interface para a resposta da API Bigboost
 */
interface BigboostEmpresaResponse {
  Result?: Array<{
    MatchKeys?: string;
    BasicData?: EmpresaBasicData;
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
 * Esquema de validação para os parâmetros da consulta de empresa
 */
const consultaEmpresaSchema = {
  cnpj: z.string()
    .min(14, 'CNPJ deve ter pelo menos 14 dígitos')
    .max(18, 'CNPJ não deve ter mais de 18 caracteres')
    .refine(
      (cnpj) => /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(cnpj),
      { message: 'Formato de CNPJ inválido' }
    )
};

/**
 * Registra a ferramenta de consulta de empresa no servidor MCP
 * @param server Instância do servidor MCP
 */
export function registerConsultaEmpresaTool(server: McpServer): void {
  registerTool(
    server,
    'consultaEmpresa',
    'Consulta dados básicos de uma empresa pelo CNPJ',
    consultaEmpresaSchema,
    async (params) => {
      // Remove formatação do CNPJ (pontos, barras e traços)
      const cnpjLimpo = params.cnpj.replace(/[^\d]/g, '');
      
      // Monta o payload da consulta
      const payload = {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "basic_data"
      };
      
      // Executa a consulta na API Bigboost
      const response = await bigboostService.executeQuery<BigboostEmpresaResponse>(
        '/empresas',
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
