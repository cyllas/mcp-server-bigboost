import { z } from 'zod';
import { registerTool } from './baseTools';
import { McpServer } from '../mcpServer.js';
import { bigboostService } from '../services/bigboostService';
import { BigboostResponseWithStatus } from '../types/errorTypes';

/**
 * Interface para os dados de um sócio ou administrador
 */
interface SocioAdministrador {
  Name?: string; // Nome do sócio ou administrador
  TaxIdNumber?: string; // CPF/CNPJ do sócio ou administrador
  Role?: string; // Cargo ou função
  QualificationType?: string; // Tipo de qualificação
  QualificationCode?: string; // Código de qualificação
  EntryDate?: string; // Data de entrada na sociedade
  SharePercentage?: number; // Percentual de participação
  IsLegalRepresentative?: boolean; // É representante legal
  IsAdministrator?: boolean; // É administrador
  // Outros campos que podem estar presentes na resposta
}

/**
 * Interface para os dados do QSA (Quadro Societário e Administrativo)
 */
interface QsaData {
  Partners?: SocioAdministrador[]; // Lista de sócios
  Administrators?: SocioAdministrador[]; // Lista de administradores
  LastUpdateDate?: string; // Data da última atualização
  // Outros campos que podem estar presentes na resposta
}

/**
 * Interface para a resposta da API Bigboost
 */
interface BigboostQsaResponse {
  Result?: Array<{
    MatchKeys?: string;
    DynamicQsaData?: QsaData;
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
 * Esquema de validação para os parâmetros da consulta de QSA
 */
const consultaQsaSchema = {
  cnpj: z.string()
    .min(14, 'CNPJ deve ter pelo menos 14 dígitos')
    .max(18, 'CNPJ não deve ter mais de 18 caracteres')
    .refine(
      (cnpj) => /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(cnpj),
      { message: 'Formato de CNPJ inválido' }
    )
};

/**
 * Registra a ferramenta de consulta de QSA no servidor MCP
 * @param server Instância do servidor MCP
 */
export function registerConsultaQsaTool(server: McpServer): void {
  registerTool(
    server,
    'consultaQsa',
    'Consulta o Quadro Societário e Administrativo (QSA) de uma empresa pelo CNPJ',
    consultaQsaSchema,
    async (params) => {
      // Remove formatação do CNPJ (pontos, barras e traços)
      const cnpjLimpo = params.cnpj.replace(/[^\d]/g, '');
      
      // Monta o payload da consulta
      const payload = {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "dynamic_qsa_data"
      };
      
      // Executa a consulta na API Bigboost
      const response = await bigboostService.executeQuery<BigboostQsaResponse>(
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
