#!/usr/bin/env node

import { createServer, startServer } from './server';

/**
 * Função principal que inicia o servidor MCP
 */
async function main() {
  // Criar o servidor MCP
  const { server, cleanup } = createServer();
  
  // Iniciar o servidor com o transporte padrão (StdioServerTransport)
  await startServer(server);
  
  // Tratamento de sinais para encerramento gracioso
  process.on('SIGINT', async () => {
    console.log('Recebido sinal SIGINT, encerrando...');
    await cleanup();
    await server.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Recebido sinal SIGTERM, encerrando...');
    await cleanup();
    await server.close();
    process.exit(0);
  });
}

// Executar a função principal
main().catch((error) => {
  console.error('Erro ao iniciar o servidor:', error);
  process.exit(1);
});


