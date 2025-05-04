/**
 * Script para monitorar conexões e logs do servidor MCP
 * Exibe estatísticas de conexões e logs em tempo real
 */
import { logViewer } from '../utils/logViewer';
import { logger, LogLevel } from '../utils/logger';

// Configurações
const REFRESH_INTERVAL = 5000; // 5 segundos
const MAX_LOGS_TO_SHOW = 10;

/**
 * Formata data e hora
 * @param dateStr String de data ISO
 * @returns Data formatada
 */
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR');
}

/**
 * Exibe estatísticas de conexão
 */
function exibirEstatisticas(): void {
  console.clear();
  console.log('='.repeat(80));
  console.log('MONITOR DE CONEXÕES MCP SERVER BIGBOOST');
  console.log('='.repeat(80));
  
  const stats = logViewer.getConnectionStats();
  
  console.log(`\nESTATÍSTICAS (atualizado em ${new Date().toLocaleString('pt-BR')})`);
  console.log('-'.repeat(80));
  console.log(`Total de conexões: ${stats.totalConnections}`);
  console.log(`Conexões ativas: ${stats.activeConnections}`);
  console.log(`Erros registrados: ${stats.errorCount}`);
  
  console.log('\nCONEXÕES POR TIPO DE TRANSPORTE:');
  for (const [transport, count] of Object.entries(stats.connectionsByTransport)) {
    console.log(`- ${transport}: ${count}`);
  }
  
  console.log('\nÚLTIMAS CONEXÕES:');
  console.log('-'.repeat(80));
  if (stats.lastConnections.length === 0) {
    console.log('Nenhuma conexão registrada.');
  } else {
    stats.lastConnections.slice(0, 5).forEach((conn, index) => {
      const status = conn.closedAt ? `Fechada em ${formatDateTime(conn.closedAt)}` : 'Ativa';
      console.log(`${index + 1}. ID: ${conn.id.substring(0, 8)}...`);
      console.log(`   Tipo: ${conn.transportType}`);
      console.log(`   Iniciada em: ${formatDateTime(conn.timestamp)}`);
      console.log(`   Status: ${status}`);
      if (conn.reason) {
        console.log(`   Motivo: ${conn.reason}`);
      }
      console.log('-'.repeat(40));
    });
  }
  
  // Exibir erros recentes
  const recentErrors = logViewer.getRecentErrors(MAX_LOGS_TO_SHOW);
  console.log('\nERROS RECENTES:');
  console.log('-'.repeat(80));
  if (recentErrors.length === 0) {
    console.log('Nenhum erro registrado.');
  } else {
    recentErrors.forEach((error, index) => {
      console.log(`${index + 1}. [${formatDateTime(error.timestamp)}] ${error.source}: ${error.message}`);
      if (error.data && error.data.error) {
        const errorDetails = error.data.error;
        if (errorDetails.stack) {
          console.log(`   Stack: ${errorDetails.stack.split('\n')[0]}`);
        }
      }
    });
  }
  
  // Exibir logs recentes
  const recentLogs = logViewer.getRecentLogs(MAX_LOGS_TO_SHOW);
  console.log('\nLOGS RECENTES:');
  console.log('-'.repeat(80));
  if (recentLogs.length === 0) {
    console.log('Nenhum log registrado.');
  } else {
    recentLogs.forEach((log) => {
      const levelColors: Record<LogLevel, string> = {
        [LogLevel.DEBUG]: '\x1b[34m', // Azul
        [LogLevel.INFO]: '\x1b[32m',  // Verde
        [LogLevel.WARN]: '\x1b[33m',  // Amarelo
        [LogLevel.ERROR]: '\x1b[31m', // Vermelho
      };
      
      // Garantir que o nível de log é válido
      const logLevel = (log.level && Object.values(LogLevel).includes(log.level)) 
        ? log.level as LogLevel 
        : LogLevel.INFO;
      
      const color = levelColors[logLevel] || '';
      const reset = '\x1b[0m';
      
      console.log(`${color}[${log.level}]${reset} [${formatDateTime(log.timestamp)}] ${log.source}: ${log.message}`);
    });
  }
  
  console.log('\n='.repeat(80));
  console.log('Pressione Ctrl+C para sair');
}

// Iniciar monitoramento
console.log('Iniciando monitoramento de conexões...');
exibirEstatisticas();

// Atualizar periodicamente
setInterval(exibirEstatisticas, REFRESH_INTERVAL);

// Limpar logs antigos ao iniciar
const removedLogs = logViewer.cleanupOldLogs(7);
if (removedLogs > 0) {
  logger.log(LogLevel.INFO, 'Monitor', `Removidos ${removedLogs} arquivos de log antigos`);
}
