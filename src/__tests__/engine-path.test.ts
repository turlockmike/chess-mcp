import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { resolveEnginePath } from '../chess-engine.js';

describe('resolveEnginePath', () => {
  let fakeBinDir: string;
  let fakeStockfish: string;

  beforeAll(() => {
    fakeBinDir = mkdtempSync(join(tmpdir(), 'chess-mcp-'));
    fakeStockfish = join(fakeBinDir, 'stockfish');
    writeFileSync(fakeStockfish, '#!/bin/sh\n', { mode: 0o755 });
  });

  afterAll(() => {
    rmSync(fakeBinDir, { recursive: true, force: true });
  });

  it('prefers STOCKFISH_PATH when set', () => {
    const env = { STOCKFISH_PATH: fakeStockfish, PATH: '' };
    expect(resolveEnginePath(env, [])).toBe(fakeStockfish);
  });

  it('rejects STOCKFISH_PATH that does not exist', () => {
    const env = { STOCKFISH_PATH: join(fakeBinDir, 'missing'), PATH: '' };
    expect(() => resolveEnginePath(env, [])).toThrow(/STOCKFISH_PATH/);
  });

  it('finds stockfish on PATH', () => {
    const env = { PATH: fakeBinDir };
    expect(resolveEnginePath(env, [])).toBe(fakeStockfish);
  });

  it('falls back to known install locations', () => {
    const env = { PATH: '' };
    expect(resolveEnginePath(env, [join(fakeBinDir, 'nope'), fakeStockfish])).toBe(fakeStockfish);
  });

  it('throws a helpful error when nothing is found', () => {
    const env = { PATH: '' };
    expect(() => resolveEnginePath(env, [])).toThrow(/STOCKFISH_PATH/);
  });
});
