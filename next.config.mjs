import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingRoot: __dirname,
  // Force Vercel to bundle the runtime-read sanctions JSON + DPIA template
  // into every serverless function. Without this, process.cwd() based reads
  // in lib/data/sanctions.ts and app/api/trust/dpia return ENOENT in prod.
  outputFileTracingIncludes: {
    '/api/sanctions/freshness': ['./data/sanctions/*.json'],
    '/api/scan': ['./data/sanctions/*.json', './data/known-bad/*.json'],
    '/api/scans/**/*': ['./data/sanctions/*.json'],
    '/api/trust/dpia': ['./docs/DPIA_TEMPLATE.md'],
    '/api/cron/sync-sanctions': ['./data/sanctions/*.json'],
  },
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
