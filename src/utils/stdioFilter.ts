/**
 * Módulo para filtrar e redirecionar saídas de stdout/stderr
 * Evita que mensagens de texto interfiram na comunicação JSON do protocolo MCP
 */
import * as fs from 'fs';
import * as path from 'path';
import { logger, LogLevel } from './logger';

// Armazenar referências originais
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

// Diretório para logs
const logDir = path.join(process.cwd(), 'logs');

// Palavras-chave em português que podem interferir na comunicação JSON
const portugueseKeywords = [
  'Ferramenta',
  'Servidor',
  'Erro',
  'Conexão',
  'Iniciando',
  'Executando',
  'Consulta',
  'registrada',
  'iniciado',
  'sucesso',
  'falhou',
  'inicializar',
  'requisição'
];

/**
 * Verifica se uma string contém palavras-chave em português
 */
function containsPortugueseKeywords(text: string): boolean {
  return portugueseKeywords.some(keyword => text.includes(keyword));
}

/**
 * Tenta verificar se uma string parece ser JSON válido
 */
function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  
  // Verificar se é um formato JSON válido
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return true;
  }
  
  // Verificar se é uma mensagem do protocolo MCP (JSON-RPC)
  if (trimmed.includes('"jsonrpc":') || 
      trimmed.includes('"method":') || 
      trimmed.includes('"params":') || 
      trimmed.includes('"id":')) {
    return true;
  }
  
  return false;
}

/**
 * Escreve uma mensagem no arquivo de log
 */
function writeToLogFile(filePath: string, message: string): void {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(filePath, `[${timestamp}] ${message}`);
  } catch (err) {
    // Silenciar erros de escrita no arquivo
  }
}

/**
 * Inicializa o filtro de stdout/stderr
 */
export function initStdioFilter(): void {
  // Criar diretório de logs se não existir
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const stdoutLogFile = path.join(logDir, `stdout-${date}.log`);
  const stderrLogFile = path.join(logDir, `stderr-${date}.log`);
  
  // Substituir stdout.write
  process.stdout.write = function(chunk: any, ...args: any[]): boolean {
    // Converter para string
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    
    // Registrar no arquivo de log
    writeToLogFile(stdoutLogFile, text);
    
    // Verificar se é uma mensagem de erro do MCP Server
    if (text.includes('failed to initialize') || text.includes('request failed')) {
      logger.log(LogLevel.ERROR, 'MCP', text.trim());
      // Não filtrar mensagens de erro do MCP Server
      return originalStdoutWrite(chunk, ...args);
    }
    
    // Verificar se é uma mensagem do protocolo MCP (JSON-RPC)
    if (text.includes('"jsonrpc":') || text.includes('"method":') || text.includes('"params":') || text.includes('"id":')) {
      // Não filtrar mensagens do protocolo MCP
      return originalStdoutWrite(chunk, ...args);
    }
    
    // Verificar se deve filtrar
    if (containsPortugueseKeywords(text) && !looksLikeJson(text)) {
      // Registrar no sistema de logs em vez de stdout
      logger.log(LogLevel.INFO, 'StdioFilter', `Filtrado: ${text.trim()}`);
      
      // Simular sucesso sem enviar para stdout
      if (args.length > 0 && typeof args[args.length - 1] === 'function') {
        const callback = args[args.length - 1];
        callback();
      }
      return true;
    }
    
    // Passar para o stdout original
    return originalStdoutWrite(chunk, ...args);
  };
  
  // Substituir stderr.write
  process.stderr.write = function(chunk: any, ...args: any[]): boolean {
    // Converter para string
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    
    // Registrar no arquivo de log
    writeToLogFile(stderrLogFile, text);
    
    // Registrar no sistema de logs
    logger.log(LogLevel.ERROR, 'StdioFilter', `Erro: ${text.trim()}`);
    
    // Verificar se deve filtrar
    if (containsPortugueseKeywords(text)) {
      // Simular sucesso sem enviar para stderr
      if (args.length > 0 && typeof args[args.length - 1] === 'function') {
        const callback = args[args.length - 1];
        callback();
      }
      return true;
    }
    
    // Passar para o stderr original
    return originalStderrWrite(chunk, ...args);
  };
  
  logger.log(LogLevel.INFO, 'StdioFilter', 'Filtro de stdout/stderr inicializado');
}

/**
 * Restaura as funções originais de stdout/stderr
 */
export function restoreStdioOriginal(): void {
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
  logger.log(LogLevel.INFO, 'StdioFilter', 'Funções originais de stdout/stderr restauradas');
}
