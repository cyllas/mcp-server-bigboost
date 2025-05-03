declare module '@modelcontextprotocol/sdk' {
  export class McpServer {
    constructor(options?: any);
    tool(name: string, schema: any, handler: (params: any) => Promise<any>, options?: { description: string }): void;
    start(): Promise<void>;
    stop(): Promise<void>;
  }
}
