// Configuração global para testes Jest
require('dotenv').config({ path: '.env.test' });

// Aumentar o timeout para testes que fazem chamadas de API
jest.setTimeout(30000);

// Silenciar logs durante os testes (opcional, remova se quiser ver os logs)
// console.log = jest.fn();
// console.info = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn();
