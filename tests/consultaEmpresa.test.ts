import dotenv from 'dotenv';
import { bigboostService } from '../src/services/bigboostService';
import { authConfig } from '../src/config/auth';

// Carrega as variáveis de ambiente
dotenv.config();

/**
 * Função para testar a consulta de empresa pelo CNPJ
 * @param cnpj CNPJ a ser consultado
 */
async function testConsultaEmpresa(cnpj: string): Promise<void> {
  // Verifica se as credenciais estão configuradas
  console.log('Verificando configuração de autenticação:');
  console.log('AccessToken configurado:', authConfig.accessToken ? 'Sim' : 'Não');
  console.log('TokenId configurado:', authConfig.tokenId ? 'Sim' : 'Não');
  console.log('-----------------------------------');
  
  try {
    // Remove formatação do CNPJ (pontos, barras e traços)
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    // Monta o payload da consulta
    const payload = {
      q: `doc{${cnpjLimpo}}`,
      Datasets: "basic_data"
    };
    
    console.log(`Consultando CNPJ: ${cnpj} (${cnpjLimpo})`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Executa a consulta na API Bigboost
    console.log('Enviando requisição para a API...');
    const response = await bigboostService.executeQuery(
      '/empresas',
      payload
    );
    
    console.log('Resposta bruta recebida:', JSON.stringify(response, null, 2));
    
    // Retornando os dados brutos da API
    const responseAny = response as any;
    
    console.log('\nResultado da consulta (dados brutos):');
    console.log(JSON.stringify({
      result: responseAny.Result || [],
      status: responseAny.Status || {},
      queryId: responseAny.QueryId,
      elapsedMilliseconds: responseAny.ElapsedMilliseconds,
      queryDate: responseAny.QueryDate
    }, null, 2));
  } catch (error: any) {
    console.error('Erro ao consultar empresa:');
    if (error.response) {
      // Erro da API com resposta
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      // Erro sem resposta (problema de conexão)
      console.error('Erro de requisição (sem resposta):', error.message);
    } else {
      // Outro tipo de erro
      console.error('Erro:', error.message);
    }
  }
}

// CNPJ a ser consultado
const cnpjTeste = '${CNPJ_TESTE}'; // CNPJ da Petrobras

// Executa o teste
testConsultaEmpresa(cnpjTeste)
  .then(() => console.log('\nTeste concluído'))
  .catch(error => console.error('\nErro no teste:', error))
  .finally(() => process.exit(0));
