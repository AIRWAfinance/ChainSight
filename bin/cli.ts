#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EtherscanClient } from '../lib/data/etherscan.js';
import { SqliteCache } from '../lib/cache/sqlite.js';
import { analyze } from '../lib/engine/analyze.js';
import { renderMarkdownReport } from '../lib/narrative/template-report.js';

const ENV = process.env;

const program = new Command();

program
  .name('chainsight')
  .description('AML risk scoring engine for Ethereum wallet addresses')
  .version('0.2.0');

program
  .command('scan')
  .description('Scan an Ethereum address and produce an AML risk report')
  .argument('<address>', 'Ethereum address to analyse (0x...)')
  .option('-o, --output <file>', 'output file (.json or .md)')
  .option('-f, --format <format>', 'output format: json | md', 'md')
  .action(async (address: string, opts: { output?: string; format: string }) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.error('ERROR: invalid Ethereum address');
      process.exit(1);
    }

    const apiKey = ENV['ETHERSCAN_API_KEY'];
    if (!apiKey || apiKey === 'your_etherscan_key_here') {
      console.error(
        'ERROR: ETHERSCAN_API_KEY is not set. See README for setup instructions.',
      );
      process.exit(1);
    }

    const cache = new SqliteCache(
      ENV['CACHE_DB_PATH'] ?? './cache/chainsight.db',
      Number(ENV['CACHE_TTL_SECONDS'] ?? '86400'),
    );
    const client = new EtherscanClient({
      apiKey,
      rateLimitPerSecond: Number(ENV['ETHERSCAN_RATE_LIMIT'] ?? '4'),
      cache,
    });

    console.error(`[chainsight] Fetching transactions for ${address}...`);
    const txs = await client.getAllTransactions(address);
    console.error(`[chainsight] Retrieved ${txs.length} transactions. Analysing...`);

    const report = analyze(address, txs);
    cache.close();

    const formatted =
      opts.format === 'json'
        ? JSON.stringify(report, null, 2)
        : renderMarkdownReport(report);

    if (opts.output) {
      const outPath = resolve(process.cwd(), opts.output);
      writeFileSync(outPath, formatted);
      console.error(`[chainsight] Report written to ${outPath}`);
    } else {
      process.stdout.write(formatted + '\n');
    }

    console.error(
      `[chainsight] Done. Risk score: ${report.riskScore}/100 — ${report.recommendation}`,
    );
  });

program.parseAsync(process.argv);
