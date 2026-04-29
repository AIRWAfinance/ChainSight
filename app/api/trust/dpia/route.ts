import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

export const runtime = 'nodejs';

/**
 * Serve the canonical DPIA template as a downloadable Markdown file.
 *
 * Source of truth lives in `docs/DPIA_TEMPLATE.md` so it is reviewable in PRs
 * by procurement teams without needing a deploy.
 */
export async function GET(): Promise<Response> {
  const path = resolve(process.cwd(), 'docs/DPIA_TEMPLATE.md');
  if (!existsSync(path)) {
    return new Response('DPIA template not bundled in this build.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  const body = readFileSync(path, 'utf-8');
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="ChainSight-DPIA-template.md"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
