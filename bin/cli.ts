#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EtherscanClient } from '../lib/data/etherscan.js';
import { SqliteCache } from '../lib/cache/sqlite.js';
import { CHAINS, isChainSlug } from '../lib/data/chains.js';
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
  .description('Scan an EVM address and produce an AML risk report')
  .argument('<address>', 'Wallet address to analyse (0x...)')
  .option(
    '-c, --chain <chain>',
    `chain slug: ${Object.keys(CHAINS).join(' | ')}`,
    'ethereum',
  )
  .option('-o, --output <file>', 'output file (.json or .md)')
  .option('-f, --format <format>', 'output format: json | md', 'md')
  .action(async (address: string, opts: { chain: string; output?: string; format: string }) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.error('ERROR: invalid wallet address (expected 0x + 40 hex chars)');
      process.exit(1);
    }

    if (!isChainSlug(opts.chain)) {
      console.error(
        `ERROR: unsupported chain "${opts.chain}". Supported: ${Object.keys(CHAINS).join(', ')}`,
      );
      process.exit(1);
    }
    const chain = CHAINS[opts.chain];

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
      chain,
    });

    console.error(`[chainsight] Scanning ${address} on ${chain.name}...`);
    const txs = await client.getAllTransactions(address);
    console.error(`[chainsight] Retrieved ${txs.length} transactions. Analysing...`);

    const report = analyze(address, txs, {
      chain: chain.slug,
      dataSourcesUsed: [
        `${chain.explorerName} (V2 API)`,
        'OFAC SDN',
        'Curated mixer/scam lists',
      ],
    });
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
