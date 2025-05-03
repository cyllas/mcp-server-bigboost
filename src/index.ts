import { createServer } from './server';

// Criar e iniciar o servidor
const server = createServer();

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', () => {
  console.log('Recebido sinal SIGINT, encerrando...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Recebido sinal SIGTERM, encerrando...');
  process.exit(0);
});
