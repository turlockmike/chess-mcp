import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ChessEngine } from "../chess-engine.js";
import { BestMovesResult, EvaluationResult } from "../chess-engine.js";

describe('ChessEngine', () => {
  let engine: ChessEngine;

  beforeAll(async () => {
    engine = new ChessEngine();
    await engine.init();
  }, 30000);

  afterAll(async () => {
    await engine.quit();
  }, 30000);

  it('should initialize successfully', () => {
    expect(engine.isReady()).toBe(true);
  });

  it('should evaluate starting position', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const evaluation = await engine.evaluatePosition(startingPosition, 1);
    
    expect(evaluation).toEqual({
      isMate: false,
      score: expect.closeTo(0, 0.5),
      moveNumber: undefined
    });
  }, 10000);

  it('should evaluate position with moves', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await engine.evaluatePosition(startingPosition, 1, 3) as BestMovesResult;
    
    expect(result.moves.length).toBe(3);
    expect(result.position).toBe(startingPosition);
    expect(result.depth).toBeGreaterThanOrEqual(1);
    expect(result.nodes).toBeGreaterThan(0);
    expect(result.time).toBeGreaterThan(0);

    result.moves.forEach(move => {
      expect(move).toMatchObject({
        move: expect.stringMatching(/^[a-h][1-8][a-h][1-8][qrbn]?/),
        algebraic: expect.stringMatching(/^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?$/),
        score: expect.any(Number),
        mate: null,
        isDraw: false
      });
    });
  }, 10000);

  it('should evaluate position with single move', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await engine.evaluatePosition(startingPosition, 1, 1) as BestMovesResult;
    
    expect(result.moves.length).toBe(1);
    expect(result.position).toBe(startingPosition);
    expect(result.depth).toBeGreaterThanOrEqual(1);
    expect(result.nodes).toBeGreaterThan(0);
    expect(result.time).toBeGreaterThan(0);

    const move = result.moves[0];
    expect(move).toEqual(expect.objectContaining({
      move: expect.stringMatching(/^[a-h][1-8][a-h][1-8][qrbn]?$/),
      algebraic: expect.stringMatching(/^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?$/),
      score: expect.any(Number),
      mate: null,
      isDraw: false
    }));
  }, 10000);

  it('should evaluate position with returnMoves=0', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await engine.evaluatePosition(startingPosition, 1, 0) as EvaluationResult;
    
    expect(result).toEqual(expect.objectContaining({
      isMate: false,
      score: expect.any(Number)
    }));
    expect((result as any).moves).toBeUndefined();
  }, 10000);

  it('should detect mate in one', async () => {
    // Scholar's mate position
    const mateInOne = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
    const evaluation = await engine.evaluatePosition(mateInOne, 5);
    
    expect(evaluation).toEqual({
      isMate: true,
      score: Infinity,
      moveNumber: 1
    });
  }, 15000);

  it('should reject invalid FEN', async () => {
    const invalidFen = 'invalid-fen-string';
    await expect(engine.evaluatePosition(invalidFen)).rejects.toThrow();
  }, 10000);

  it('should handle depth parameter', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const evaluation = await engine.evaluatePosition(startingPosition, 1);
    
    // Depth 1 should return quickly
    expect(evaluation).toBeDefined();
  }, 10000);

  describe('getBestMoves', () => {
    it('should get best moves from starting position', async () => {
      const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const result = await engine.getBestMoves(startingPosition, {
        depth: 10,
        numMoves: 3,
        timeLimit: 1000
      });

      expect(result.moves.length).toBeLessThanOrEqual(3);
      expect(result.position).toBe(startingPosition);
      expect(result.depth).toBeGreaterThanOrEqual(10);
      expect(result.nodes).toBeGreaterThan(0);
      expect(result.time).toBeGreaterThan(0);
      expect(result.time).toBeLessThanOrEqual(2000); // Allow some buffer over timeLimit

      result.moves.forEach(move => {
        expect(move).toEqual({
          move: expect.stringMatching(/^[a-h][1-8][a-h][1-8][qrbn]?$/),
          algebraic: expect.stringMatching(/^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?$/),
          score: expect.any(Number),
          mate: null,
          isDraw: false
        });
      });
    }, 15000);

    it('should handle scores correctly for black moves', async () => {
      // Position where black is clearly winning (-5 pawns)
      const blackWinningPosition = 'rnbqkbnr/pppppppp/8/8/8/8/P1P1P1P1/RNBQKBNR b KQkq - 0 1';
      
      // Test direct evaluation
      const evaluation = await engine.evaluatePosition(blackWinningPosition, 10);
      expect(evaluation).toMatchObject({
        isMate: false,
        score: expect.any(Number)
      });
      // Score should be negative since Black is winning
      // Each pawn is worth approximately 1 point, and Black is up 5 pawns
      const evalScore = (evaluation as EvaluationResult).score;
      expect(evalScore).toBeLessThan(-4);
      expect(evalScore).toBeGreaterThan(-6); // Allow some variation but not too much

      // Test through getBestMoves
      const result = await engine.getBestMoves(blackWinningPosition, {
        depth: 10,
        numMoves: 1
      });

      expect(result.moves.length).toBe(1);
      const move = result.moves[0];
      // Score should be negative since Black is winning
      expect(move.score).toBeLessThan(-4); // Black is up 5 pawns
      expect(move.score).toBeGreaterThan(-6); // Allow some variation but not too much
      expect(move.mate).toBeNull(); // Should not be a mate
    }, 15000);

    it('should handle stalemate position', async () => {
      // This is a stalemate position
      const stalematePosition = 'k7/8/1Q6/8/8/8/8/K7 b - - 0 1';
      const result = await engine.getBestMoves(stalematePosition);

      expect(result).toEqual({
        moves: [],
        position: stalematePosition,
        depth: 0,
        nodes: 0,
        time: 0
      });
    }, 10000);

    it('should detect mate in one position', async () => {
      // Position with mate in 1 (Qh7# or Qxf7#)
      const mateInOnePosition = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1';
      const result = await engine.getBestMoves(mateInOnePosition, {
        depth: 10,
        numMoves: 1
      });

      expect(result.moves.length).toBe(1);
      expect(result.position).toBe(mateInOnePosition);
      expect(result.depth).toBeGreaterThanOrEqual(10);
      expect(result.nodes).toBeGreaterThan(0);
      expect(result.time).toBeGreaterThan(0);

      const move = result.moves[0];
      expect(move).toMatchObject({
        move: expect.stringMatching(/^f3[fh][78]/),
        algebraic: expect.stringMatching(/^Qx?[fh]7#$/),
        score: expect.any(Number),
        mate: 1,
        isDraw: false
      });
    }, 15000);

    it('should handle custom options', async () => {
      const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const result = await engine.getBestMoves(startingPosition, {
        depth: 5,
        numMoves: 1,
        timeLimit: 500
      });

      expect(result.moves.length).toBe(1);
      expect(result.position).toBe(startingPosition);
      expect(result.depth).toBeGreaterThanOrEqual(5);
      expect(result.nodes).toBeGreaterThan(0);
      expect(result.time).toBeGreaterThan(0);
      expect(result.time).toBeLessThanOrEqual(1000); // Allow some buffer

      const move = result.moves[0];
      expect(move).toMatchObject({
        move: expect.stringMatching(/^[a-h][1-8][a-h][1-8][qrbn]?/),
        algebraic: expect.stringMatching(/^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?$/),
        score: expect.any(Number),
        mate: null,
        isDraw: false
      });
    }, 10000);

    it('should reject invalid FEN', async () => {
      const invalidFen = 'invalid-fen-string';
      await expect(engine.getBestMoves(invalidFen)).rejects.toThrow('Invalid FEN position');
    }, 10000);
  });
});
