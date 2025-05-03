import { z } from 'zod';
import { registerTool } from './baseTools';
import { McpServer } from '../mcpServer.js';
import { bigboostService } from '../services/bigboostService';
import { BigboostResponseWithStatus } from '../types/errorTypes';

/**
 * Interface para os dados básicos da empresa
 */
interface BasicData {
  TaxIdNumber?: string; // CNPJ
  OfficialName?: string; // Razão social
  TradeName?: string; // Nome fantasia
  FoundedDate?: string; // Data de fundação
  IsHeadquarter?: boolean; // É matriz
  TaxIdStatus?: string; // Situação do CNPJ
  TaxIdStatusDate?: string; // Data da situação cadastral
  Activities?: Array<{ // Atividades econômicas
    IsMain?: boolean;
    Code?: string;
    Activity?: string;
  }>;
  LegalNature?: { // Natureza jurídica
    Code?: string;
    Activity?: string;
  };
  AdditionalOutputData?: {
    Capital?: string; // Capital social por extenso
    CapitalRS?: string; // Capital social em reais
  };
}

/**
 * Interface para os dados de email da empresa
 */
interface Email {
  EmailAddress?: string; // Endereço de email
  Domain?: string; // Domínio
  UserName?: string; // Nome de usuário
  Type?: string; // Tipo de email
  LastUpdateDate?: string; // Data da última atualização
}

/**
 * Interface para os dados de endereço da empresa
 */
interface Address {
  Typology?: string; // Tipo de logradouro
  Title?: string; // Título
  AddressMain?: string; // Logradouro
  Number?: string; // Número
  Complement?: string; // Complemento
  Neighborhood?: string; // Bairro
  ZipCode?: string; // CEP
  City?: string; // Cidade
  State?: string; // Estado
  Country?: string; // País
  Type?: string; // Tipo de endereço
  ComplementType?: string; // Tipo de complemento
  LastUpdateDate?: string; // Data da última atualização
}

/**
 * Interface para os dados de telefone da empresa
 */
interface Phone {
  Number?: string; // Número
  AreaCode?: string; // Código de área
  CountryCode?: string; // Código do país
  Complement?: string; // Complemento
  Type?: string; // Tipo de telefone
  PhoneNumberOfEntities?: number; // Número de entidades com este telefone
  LastUpdateDate?: string; // Data da última atualização
}

/**
 * Interface para os dados de registro da empresa
 */
interface RegistroEmpresaData {
  BasicData?: BasicData; // Dados básicos
  Emails?: { // Emails
    Primary?: Email; // Email principal
    Secondary?: Email; // Email secundário
  };
  Addresses?: { // Endereços
    Primary?: Address; // Endereço principal
  };
  Phones?: { // Telefones
    Primary?: Phone; // Telefone principal
    Secondary?: Phone; // Telefone secundário
  };
}

/**
 * Interface para a resposta da API Bigboost
 */
interface BigboostRegistroEmpresaResponse {
  Result?: Array<{
    MatchKeys?: string;
    RegistrationData?: RegistroEmpresaData;
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
 * Esquema de validação para os parâmetros da consulta de registro de empresa
 */
const consultaRegistroEmpresaSchema = {
  cnpj: z.string()
    .min(14, 'CNPJ deve ter pelo menos 14 dígitos')
    .max(18, 'CNPJ não deve ter mais de 18 caracteres')
    .refine(
      (cnpj) => /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(cnpj),
      { message: 'Formato de CNPJ inválido' }
    )
};

/**
 * Registra a ferramenta de consulta de registro de empresa no servidor MCP
 * @param server Instância do servidor MCP
 */
export function registerConsultaRegistroEmpresaTool(server: McpServer): void {
  registerTool(
    server,
    'consultaRegistroEmpresa',
    'Consulta dados completos de registro de uma empresa pelo CNPJ, incluindo endereços e contatos',
    consultaRegistroEmpresaSchema,
    async (params) => {
      // Remove formatação do CNPJ (pontos, barras e traços)
      const cnpjLimpo = params.cnpj.replace(/[^\d]/g, '');
      
      // Monta o payload da consulta
      const payload = {
        q: `doc{${cnpjLimpo}}`,
        Datasets: "registration_data"
      };
      
      // Executa a consulta na API Bigboost
      const response = await bigboostService.executeQuery<BigboostRegistroEmpresaResponse>(
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
