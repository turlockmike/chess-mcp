import { describe, it, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { PlayMoveHandler } from '../handlers/play-move.handler.js';
import { ChessEngine } from '../chess-engine.js';
import { ChessImageService } from '../chess-image-service.js';
import { CallToolRequest, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

jest.mock('../chess-image-service.js');

describe('PlayMoveHandler', () => {
  let handler: PlayMoveHandler;
  let engine: ChessEngine;
  let mockImageService: jest.Mocked<ChessImageService>;

  beforeAll(async () => {
    engine = new ChessEngine();
    await engine.init();
  }, 30000);

  afterAll(async () => {
    await engine.quit();
  }, 30000);

  beforeEach(() => {
    mockImageService = new ChessImageService() as jest.Mocked<ChessImageService>;
    mockImageService.generateImage = jest.fn();
    handler = new PlayMoveHandler(engine, mockImageService);
  });

  const createRequest = (args: any): CallToolRequest => ({
    method: 'tools/call',
    params: { 
      name: 'play-move',
      arguments: args
    }
  });

  describe('handle', () => {
    it('should validate a legal move from starting position', async () => {
      const startPos = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const move = 'e2e4';
      const expectedFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

      const result = await handler.handle(createRequest({ move }));

      expect(result.content[0]).toEqual({
        type: 'text',
        text: `Move ${move} is legal. New position: ${expectedFen}`
      });
      expect(result.isError).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });

    it('should handle illegal moves', async () => {
      const move = 'e2e5'; // Illegal pawn move - can't move 3 squares
      
      const result = await handler.handle(createRequest({ move }));

      expect(result.content[0]).toEqual({
        type: 'text',
        text: `Move ${move} is illegal.`
      });
      expect(result.content.length).toBe(1); // No evaluation or image for illegal moves
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(ErrorCode.InvalidRequest);
    });

    it('should handle invalid move format', async () => {
      const result = await handler.handle(createRequest({ 
        move: 'invalid'
      }));

      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(ErrorCode.InvalidRequest);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe('Error: Invalid move format');
    });

    it('should handle invalid FEN', async () => {
      const result = await handler.handle(createRequest({ 
        fen: 'invalid-fen',
        move: 'e2e4'
      }));

      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(ErrorCode.InvalidRequest);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe('Error: Invalid FEN position');
    });

    it('should include evaluation when requested', async () => {
      const move = 'e2e4';

      const result = await handler.handle(createRequest({ 
        move,
        includeEvaluation: true
      }));

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('legal');
      expect(result.content[1].type).toBe('text');
      // The exact evaluation may vary, but it should be a reasonable number for e4
      expect(result.content[1].text).toMatch(/Evaluation: [-\d.]+ pawns/);
      expect(result.isError).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    }, 10000);

    it('should include image when requested', async () => {
      const move = 'e2e4';
      const imageBuffer = Buffer.from('fake-image-data');
      mockImageService.generateImage.mockResolvedValue(imageBuffer);

      const result = await handler.handle(createRequest({ 
        move,
        includeImage: true
      }));

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('legal');
      expect(result.content[1]).toEqual({
        type: 'image',
        data: imageBuffer.toString('base64'),
        mimeType: 'image/png'
      });
      expect(result.isError).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });

    it('should handle custom starting position with FEN', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const move = 'e7e5';
      const expectedFen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';

      const result = await handler.handle(createRequest({ 
        fen,
        move
      }));

      expect(result.content[0].text).toBe(`Move ${move} is legal. New position: ${expectedFen}`);
      expect(result.isError).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });

    it('should detect mate positions in evaluation', async () => {
      // Scholar's mate position
      const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
      const move = 'h5f7'; // Qxf7#

      const result = await handler.handle(createRequest({ 
        fen,
        move,
        includeEvaluation: true
      }));

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('legal');
      expect(result.content[1].type).toBe('text');
      expect(result.content[1].text).toContain('Mate');
      expect(result.isError).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    }, 15000);
  });
}); 