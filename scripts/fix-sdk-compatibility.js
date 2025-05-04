#!/usr/bin/env node

/**
 * Este script corrige problemas de compatibilidade com o SDK do MCP
 * após a instalação do pacote
 */

const fs = require('fs');
const path = require('path');

// Caminho para o package.json do SDK
const sdkPackagePath = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/package.json');

try {
  if (fs.existsSync(sdkPackagePath)) {
    const sdkPackage = require(sdkPackagePath);
    
    // Adicionar campo "exports" se não existir
    if (!sdkPackage.exports) {
      sdkPackage.exports = {
        ".": {
          "import": "./dist/esm/index.js",
          "require": "./dist/cjs/index.js",
          "default": "./dist/cjs/index.js"
        }
      };
      
      // Salvar as alterações
      fs.writeFileSync(sdkPackagePath, JSON.stringify(sdkPackage, null, 2));
      console.log('Compatibilidade do SDK corrigida com sucesso!');
    }
  } else {
    console.warn('Arquivo package.json do SDK não encontrado. Pulando correção de compatibilidade.');
  }
} catch (error) {
  console.error('Erro ao corrigir compatibilidade do SDK:', error);
}
