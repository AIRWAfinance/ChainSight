import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

describe('DPIA template asset', () => {
  const path = resolve(process.cwd(), 'docs/DPIA_TEMPLATE.md');

  it('exists at the path the API route reads', () => {
    expect(existsSync(path)).toBe(true);
  });

  it('is non-empty markdown with the canonical headings', () => {
    const body = readFileSync(path, 'utf-8');
    expect(body.length).toBeGreaterThan(500);
    expect(body).toContain('## 1. Processing description');
    expect(body).toContain('## 4. Technical and organisational measures');
    expect(body).toContain('## 6. Decision');
  });

  it('contains live links to the runtime trust + coverage pages', () => {
    const body = readFileSync(path, 'utf-8');
    expect(body).toContain('/trust');
    expect(body).toContain('/methodology/coverage');
  });

  it('is a reasonable size — flag if accidentally truncated', () => {
    const stats = statSync(path);
    expect(stats.size).toBeGreaterThan(2_000);
    expect(stats.size).toBeLessThan(50_000);
  });
});
