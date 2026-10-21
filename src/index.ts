#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { ChessEngine } from './chess-engine.js';
import { ChessImageService } from './chess-image-service.js';
import {
  SimpleHandlerRegistry,
  ListToolsHandler,
  EvaluatePositionHandler,
  GenerateImageHandler,
  PlayMoveHandler,
  MastersLookupHandler,
} from './handlers/index.js';

interface CustomMcpError extends Error {
  code?: string;
}

export class ChessServer {
  private server: Server;
  private engine: ChessEngine;
  private imageService: ChessImageService;
  private handlerRegistry: SimpleHandlerRegistry;
  private isConnected: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: 'chess-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.engine = new ChessEngine();
    this.imageService = new ChessImageService();
    this.handlerRegistry = new SimpleHandlerRegistry();
    this.setupServer();
    
    this.server.onerror = (error: CustomMcpError) => {
      console.error(`Server error: ${error.message}`, { code: error.code, stack: error.stack });
    };

    process.on('SIGINT', async () => {
      await this.close();
      process.exit(0);
    });
  }

  private setupServer() {
    // Initialize handlers
    const listToolsHandler = new ListToolsHandler();
    const evaluatePositionHandler = new EvaluatePositionHandler(this.engine, this.imageService);
    const generateImageHandler = new GenerateImageHandler(this.imageService);
    const playMoveHandler = new PlayMoveHandler(this.engine, this.imageService);
    const mastersLookupHandler = new MastersLookupHandler();

    // Register handlers
    this.handlerRegistry.register('list_tools', listToolsHandler);
    this.handlerRegistry.register('evaluate_chess_position', evaluatePositionHandler);
    this.handlerRegistry.register('generate_chess_position_image', generateImageHandler);
    this.handlerRegistry.register('play_chess_move', playMoveHandler);
    this.handlerRegistry.register('lookup_masters_position', mastersLookupHandler);

    // Set up request handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      const handler = this.handlerRegistry.get('list_tools');
      if (!handler) {
        throw new McpError(ErrorCode.MethodNotFound, 'List tools handler not found');
      }
      return handler.handle(request);
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const handler = this.handlerRegistry.get(request.params.name);
      if (!handler) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
      return handler.handle(request);
    });
  }

  async run(transport?: Transport) {
    await this.engine.init();
    const serverTransport = transport || new StdioServerTransport();
    await this.server.connect(serverTransport);
    this.isConnected = true;
  }

  async close() {
    await this.engine.quit();
    await this.server.close();
    this.isConnected = false;
  }
}

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ChessServer();
  server.run().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
