/**
 * Serviço de logging para o servidor MCP
 * Implementa logs estruturados e evita interferência na comunicação do protocolo MCP
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Tipos de log
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Interface para conexão
export interface ConnectionInfo {
  id: string;
  transportType: string;
  timestamp: string;
  queryParams?: any;
  command?: string;
  args?: string;
  env?: any;
}

// Classe para gerenciar logs
export class Logger {
  private static instance: Logger;
  private logDir: string;
  private logFile: string;
  private connectionLogFile: string;
  private errorLogFile: string;
  private connections: Map<string, ConnectionInfo> = new Map();
  private enabled: boolean = true;

  private constructor() {
    // Criar diretório de logs se não existir
    this.logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    this.logFile = path.join(this.logDir, `mcp-server-${date}.log`);
    this.connectionLogFile = path.join(this.logDir, `connections-${date}.log`);
    this.errorLogFile = path.join(this.logDir, `errors-${date}.log`);
    
    // Registrar informações iniciais
    this.writeToLog(LogLevel.INFO, 'Logger', 'Sistema de logs iniciado');
  }

  /**
   * Obtém a instância única do logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Habilita ou desabilita os logs
   * @param enabled Estado de habilitação dos logs
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Registra uma mensagem de log
   * @param level Nível do log
   * @param source Origem do log
   * @param message Mensagem a ser registrada
   * @param data Dados adicionais (opcional)
   */
  public log(level: LogLevel, source: string, message: string, data?: any): void {
    if (!this.enabled) return;
    
    this.writeToLog(level, source, message, data);
    
    // Registrar erros em arquivo separado
    if (level === LogLevel.ERROR) {
      this.writeToErrorLog(source, message, data);
    }
  }

  /**
   * Registra uma nova conexão
   * @param connectionId ID da conexão
   * @param transportType Tipo de transporte
   * @param queryParams Parâmetros da consulta
   */
  public logConnection(connectionId: string, transportType: string, queryParams?: any): void {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const connectionInfo: ConnectionInfo = {
      id: connectionId,
      transportType,
      timestamp,
      queryParams
    };
    
    // Extrair informações específicas se disponíveis
    if (queryParams) {
      connectionInfo.command = queryParams.command;
      connectionInfo.args = queryParams.args;
      connectionInfo.env = queryParams.env ? JSON.parse(queryParams.env) : undefined;
    }
    
    // Armazenar informações da conexão
    this.connections.set(connectionId, connectionInfo);
    
    // Registrar em arquivo
    this.writeToConnectionLog(connectionInfo);
    
    // Log geral
    this.log(LogLevel.INFO, 'Connection', `Nova conexão estabelecida: ${connectionId}`, { transportType, queryParams });
  }

  /**
   * Registra mensagem recebida em uma conexão
   * @param connectionId ID da conexão
   * @param message Mensagem recebida
   */
  public logMessage(connectionId: string, message: any): void {
    if (!this.enabled) return;
    
    const connection = this.connections.get(connectionId);
    if (!connection) {
      this.log(LogLevel.WARN, 'Message', `Mensagem recebida para conexão desconhecida: ${connectionId}`);
      return;
    }
    
    this.log(LogLevel.DEBUG, 'Message', `Mensagem recebida para conexão ${connectionId}`, { 
      messageType: typeof message,
      messageSize: JSON.stringify(message).length
    });
  }

  /**
   * Registra erro em uma conexão
   * @param connectionId ID da conexão (opcional)
   * @param error Erro ocorrido
   * @param context Contexto adicional
   */
  public logError(connectionId: string | undefined, error: any, context?: string): void {
    if (!this.enabled) return;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    const logData: any = {
      errorMessage,
      errorStack,
      context
    };
    
    if (connectionId) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        logData.connection = connection;
      }
    }
    
    this.log(LogLevel.ERROR, 'Error', errorMessage, logData);
  }

  /**
   * Registra o encerramento de uma conexão
   * @param connectionId ID da conexão
   * @param reason Motivo do encerramento
   */
  public logConnectionClosed(connectionId: string, reason?: string): void {
    if (!this.enabled) return;
    
    const connection = this.connections.get(connectionId);
    if (!connection) {
      this.log(LogLevel.WARN, 'Connection', `Tentativa de encerrar conexão desconhecida: ${connectionId}`);
      return;
    }
    
    this.log(LogLevel.INFO, 'Connection', `Conexão encerrada: ${connectionId}`, { reason });
    
    // Atualizar registro de conexão
    const closedInfo = {
      ...connection,
      closedAt: new Date().toISOString(),
      reason
    };
    
    this.writeToConnectionLog(closedInfo);
    
    // Remover da lista de conexões ativas
    this.connections.delete(connectionId);
  }

  /**
   * Obtém estatísticas das conexões
   */
  public getConnectionStats(): any {
    return {
      activeConnections: this.connections.size,
      connections: Array.from(this.connections.values())
    };
  }

  /**
   * Escreve no arquivo de log principal
   */
  private writeToLog(level: LogLevel, source: string, message: string, data?: any): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        source,
        message,
        data: data || null,
        hostname: os.hostname(),
        pid: process.pid
      };
      
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      // Fallback para console em caso de erro ao escrever no arquivo
      console.error('Erro ao escrever no arquivo de log:', error);
    }
  }

  /**
   * Escreve no arquivo de log de conexões
   */
  private writeToConnectionLog(connectionInfo: any): void {
    try {
      fs.appendFileSync(this.connectionLogFile, JSON.stringify(connectionInfo) + '\n');
    } catch (error) {
      console.error('Erro ao escrever no arquivo de log de conexões:', error);
    }
  }

  /**
   * Escreve no arquivo de log de erros
   */
  private writeToErrorLog(source: string, message: string, data?: any): void {
    try {
      const timestamp = new Date().toISOString();
      const errorEntry = {
        timestamp,
        source,
        message,
        data: data || null
      };
      
      fs.appendFileSync(this.errorLogFile, JSON.stringify(errorEntry) + '\n');
    } catch (error) {
      console.error('Erro ao escrever no arquivo de log de erros:', error);
    }
  }
}

// Exportar funções de conveniência
export const logger = Logger.getInstance();

export const debug = (source: string, message: string, data?: any) => 
  logger.log(LogLevel.DEBUG, source, message, data);

export const info = (source: string, message: string, data?: any) => 
  logger.log(LogLevel.INFO, source, message, data);

export const warn = (source: string, message: string, data?: any) => 
  logger.log(LogLevel.WARN, source, message, data);

export const error = (source: string, message: string, data?: any) => 
  logger.log(LogLevel.ERROR, source, message, data);

export const logConnection = (connectionId: string, transportType: string, queryParams?: any) => 
  logger.logConnection(connectionId, transportType, queryParams);

export const logMessage = (connectionId: string, message: any) => 
  logger.logMessage(connectionId, message);

export const logError = (connectionId: string | undefined, error: any, context?: string) => 
  logger.logError(connectionId, error, context);

export const logConnectionClosed = (connectionId: string, reason?: string) => 
  logger.logConnectionClosed(connectionId, reason);
