import express from 'express';
import { Server } from 'http';
import { registerTools } from './tools';

/**
 * Interface para uma ferramenta API
 */
export interface ApiTool {
  name: string;
  description: string;
  schema: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

/**
 * Classe para o servidor API
 */
export class ApiServer {
  private app: any;
  private server: Server | null = null;
  private tools: Map<string, ApiTool> = new Map();
  private port: number;

  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  /**
   * Configura as rotas do servidor
   */
  private setupRoutes() {
    const self = this;
    
    // Rota principal para a API
    this.app.post('/api', function(req: any, res: any) {
      try {
        const { name, parameters } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Nome da ferramenta não especificado' });
        }
        
        const tool = self.tools.get(name);
        if (!tool) {
          return res.status(404).json({ error: `Ferramenta '${name}' não encontrada` });
        }
        
        // Executar o handler da ferramenta
        tool.handler(parameters)
          .then((result: any) => {
            return res.json(result);
          })
          .catch((error: any) => {
            console.error(`Erro ao executar a ferramenta ${name}:`, error);
            return res.status(500).json({ 
              error: 'Erro ao executar a ferramenta', 
              details: error.message 
            });
          });
      } catch (error: any) {
        console.error('Erro ao processar requisição API:', error);
        return res.status(500).json({ 
          error: 'Erro interno do servidor', 
          details: error.message 
        });
      }
    });
    
    // Rota para listar ferramentas disponíveis
    this.app.get('/api/tools', function(req: any, res: any) {
      const toolsList = Array.from(self.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        schema: tool.schema
      }));
      
      res.json(toolsList);
    });

    // Rota de status/saúde
    this.app.get('/status', function(req: any, res: any) {
      res.json({
        status: 'online',
        toolsCount: self.tools.size,
        uptime: process.uptime()
      });
    });
  }

  /**
   * Registra uma ferramenta no servidor API
   * @param tool Ferramenta a ser registrada
   */
  registerTool(tool: ApiTool): void {
    this.tools.set(tool.name, tool);
    console.log(`Ferramenta '${tool.name}' registrada com sucesso`);
  }

  /**
   * Inicia o servidor API
   * @returns Promise que resolve quando o servidor estiver pronto
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Servidor API iniciado na porta ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Para o servidor API
   * @returns Promise que resolve quando o servidor for parado
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = null;
          console.log('Servidor API parado');
          resolve();
        }
      });
    });
  }
}
