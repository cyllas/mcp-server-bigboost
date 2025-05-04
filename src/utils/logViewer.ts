/**
 * Utilitário para visualização e análise de logs do servidor MCP
 * Permite visualizar conexões ativas e logs de forma estruturada
 */
import * as fs from 'fs';
import * as path from 'path';
import { logger, LogLevel } from './logger.js';

/**
 * Interface para estatísticas de conexão
 */
interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  errorCount: number;
  connectionsByTransport: Record<string, number>;
  lastConnections: any[];
}

/**
 * Classe para visualização e análise de logs
 */
export class LogViewer {
  private logDir: string;
  
  constructor() {
    this.logDir = path.resolve(process.cwd(), 'logs');
  }
  
  /**
   * Obtém estatísticas das conexões
   * @returns Estatísticas de conexão
   */
  public getConnectionStats(): ConnectionStats {
    try {
      const date = new Date().toISOString().split('T')[0];
      const connectionLogFile = path.join(this.logDir, `connections-${date}.log`);
      
      if (!fs.existsSync(connectionLogFile)) {
        return this.getEmptyStats();
      }
      
      const content = fs.readFileSync(connectionLogFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const connections = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      }).filter(conn => conn !== null);
      
      // Calcular estatísticas
      const activeConnections = connections.filter(conn => !conn.closedAt);
      const transportTypes = connections.reduce((acc, conn) => {
        const transport = conn.transportType || 'unknown';
        acc[transport] = (acc[transport] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Obter últimas conexões (mais recentes primeiro)
      const lastConnections = [...connections]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      return {
        totalConnections: connections.length,
        activeConnections: activeConnections.length,
        errorCount: this.countErrors(),
        connectionsByTransport: transportTypes,
        lastConnections
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de conexão:', error);
      return this.getEmptyStats();
    }
  }
  
  /**
   * Obtém logs de erros recentes
   * @param limit Limite de logs a retornar
   * @returns Array de logs de erro
   */
  public getRecentErrors(limit: number = 10): any[] {
    try {
      const date = new Date().toISOString().split('T')[0];
      const errorLogFile = path.join(this.logDir, `errors-${date}.log`);
      
      if (!fs.existsSync(errorLogFile)) {
        return [];
      }
      
      const content = fs.readFileSync(errorLogFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      })
      .filter(log => log !== null)
      .slice(-limit);
    } catch (error) {
      console.error('Erro ao obter logs de erro:', error);
      return [];
    }
  }
  
  /**
   * Obtém logs gerais recentes
   * @param limit Limite de logs a retornar
   * @param level Nível de log (opcional)
   * @returns Array de logs
   */
  public getRecentLogs(limit: number = 50, level?: LogLevel): any[] {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `mcp-server-${date}.log`);
      
      if (!fs.existsSync(logFile)) {
        return [];
      }
      
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      })
      .filter(log => log !== null && (!level || log.level === level))
      .slice(-limit);
    } catch (error) {
      console.error('Erro ao obter logs gerais:', error);
      return [];
    }
  }
  
  /**
   * Conta o número de erros nos logs
   * @returns Número de erros
   */
  private countErrors(): number {
    try {
      const date = new Date().toISOString().split('T')[0];
      const errorLogFile = path.join(this.logDir, `errors-${date}.log`);
      
      if (!fs.existsSync(errorLogFile)) {
        return 0;
      }
      
      const content = fs.readFileSync(errorLogFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      return lines.length;
    } catch (error) {
      console.error('Erro ao contar erros:', error);
      return 0;
    }
  }
  
  /**
   * Retorna estatísticas vazias
   * @returns Estatísticas vazias
   */
  private getEmptyStats(): ConnectionStats {
    return {
      totalConnections: 0,
      activeConnections: 0,
      errorCount: 0,
      connectionsByTransport: {},
      lastConnections: []
    };
  }
  
  /**
   * Limpa logs antigos
   * @param daysToKeep Número de dias para manter logs
   * @returns Número de arquivos removidos
   */
  public cleanupOldLogs(daysToKeep: number = 7): number {
    try {
      if (!fs.existsSync(this.logDir)) {
        return 0;
      }
      
      const files = fs.readdirSync(this.logDir);
      const now = new Date();
      let removedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const fileDate = new Date(stats.mtime);
        
        // Calcular diferença em dias
        const diffDays = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > daysToKeep) {
          fs.unlinkSync(filePath);
          removedCount++;
        }
      }
      
      return removedCount;
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      return 0;
    }
  }
}

// Exportar instância
export const logViewer = new LogViewer();
