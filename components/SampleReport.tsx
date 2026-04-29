import type { RiskReport } from '@/lib/engine/types';
import { Report } from './Report';

const SAMPLE_REPORT: RiskReport = {
  address: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4',
  chain: 'ethereum',
  scannedAt: '2026-04-28T11:31:00.040Z',
  riskScore: 15,
  scoreBreakdown: [{ typology: 'layering', points: 15 }],
  recommendation: 'standard_dd',
  flags: [
    {
      typology: 'layering',
      severity: 'medium',
      title: 'Layering pattern: 5 rapid pass-through transactions',
      description:
        'Inbound ETH was forwarded out within 60 minutes in near-identical amounts (within 5% tolerance). Total value passed through: 39.5630 ETH. This is a classic layering pattern in the placement-layering-integration framework — typical of fund commingling or trading-account routing.',
      evidence: [
        {
          txHash: '0x880e7e8f61bf5246c0daf48d39cb606242656ce30b03f79a6c89a2e08a475953',
          counterpartyAddress: '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0',
          counterpartyLabel: 'Kraken 4',
          counterpartyCategory: 'cex',
          amountWei: '12005600000000000000',
          timestamp: '2018-03-07T11:03:28.000Z',
          note: 'IN',
        },
        {
          txHash: '0xe1d2ede801b10a559693fd87753c4bfd745ddcff3e679920dcab9ffb44721881',
          counterpartyAddress: '0xf0b9307abbebfc9f671d4f042624b26543b4a1b5',
          amountWei: '12000000000000000000',
          timestamp: '2018-03-07T11:07:00.000Z',
          note: '+212s',
        },
        {
          txHash: '0xad6b4102228ba0bb5e278be90a3ae649c803b394773824e9e98f9cebaa3042bc',
          counterpartyAddress: '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0',
          counterpartyLabel: 'Kraken 4',
          counterpartyCategory: 'cex',
          amountWei: '16766170000000000000',
          timestamp: '2018-03-31T17:40:11.000Z',
          note: 'IN',
        },
        {
          txHash: '0xd229032620a4a254b6a1987d9a56c15ea8798480af99ae16a2253bbc5ffbb7a4',
          counterpartyAddress: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
          counterpartyLabel: 'Uniswap V2 Router',
          counterpartyCategory: 'dex',
          amountWei: '16700000000000000000',
          timestamp: '2018-03-31T18:13:01.000Z',
          note: '+1970s',
        },
      ],
      citations: [
        {
          source: 'FATF · 2020',
          reference:
            'Virtual Assets Red Flag Indicators, Section 4.2(a) — "Use of crypto-assets to layer illicit proceeds through rapid, near-equal pass-through transfers."',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
        },
      ],
    },
  ],
  graph: {
    truncatedAt: 8,
    nodes: [
      { id: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', label: 'Subject', category: 'subject', totalIn: 56.36, totalOut: 47.7, txCount: 231, isSubject: true },
      { id: '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', label: 'Kraken 4', category: 'cex', totalIn: 28.77, totalOut: 0, txCount: 12, isFlagged: true },
      { id: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', label: 'Uniswap V2 Router', category: 'dex', totalIn: 0, totalOut: 20.75, txCount: 24, isFlagged: true },
      { id: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance 14', category: 'cex', totalIn: 12.5, totalOut: 8.25, txCount: 9 },
      { id: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', label: 'Sushiswap Router', category: 'dex', totalIn: 0, totalOut: 6.4, txCount: 8 },
      { id: '0xa910f92acdaf488fa6ef02174fb86208ad7722ba', label: 'Coinbase Prime', category: 'cex', totalIn: 8.1, totalOut: 0, txCount: 4 },
      { id: '0x3ee18b2214aff97000d974cf647e7c347e8fa585', label: 'Wormhole Token Bridge', category: 'bridge', totalIn: 0, totalOut: 4.2, txCount: 3 },
      { id: '0xf0b9307abbebfc9f671d4f042624b26543b4a1b5', category: 'unknown', totalIn: 0, totalOut: 6.95, txCount: 5, isFlagged: true },
      { id: '0x6e2e5b0bad80eac708fefe902a7e6917b95d7d2a', category: 'unknown', totalIn: 0, totalOut: 16.7, txCount: 1, isFlagged: true },
    ],
    edges: [
      { source: '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', target: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', value: 28.77, txCount: 12 },
      { source: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', target: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', value: 20.75, txCount: 24 },
      { source: '0x28c6c06298d514db089934071355e5743bf21d60', target: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', value: 12.5, txCount: 5 },
      { source: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', target: '0x28c6c06298d514db089934071355e5743bf21d60', value: 8.25, txCount: 4 },
      { source: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', target: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', value: 6.4, txCount: 8 },
      { source: '0xa910f92acdaf488fa6ef02174fb86208ad7722ba', target: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', value: 8.1, txCount: 4 },
      { source: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', target: '0x3ee18b2214aff97000d974cf647e7c347e8fa585', value: 4.2, txCount: 3 },
      { source: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', target: '0xf0b9307abbebfc9f671d4f042624b26543b4a1b5', value: 6.95, txCount: 5 },
      { source: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4', target: '0x6e2e5b0bad80eac708fefe902a7e6917b95d7d2a', value: 16.7, txCount: 1 },
    ],
  },
  summary: {
    totalTransactions: 231,
    firstSeen: '2018-02-27T15:20:37.000Z',
    lastSeen: '2026-01-24T20:35:35.000Z',
    distinctCounterparties: 116,
  },
  meta: {
    chainsightVersion: '0.2.0',
    typologiesEvaluated: [
      'sanctions_exposure',
      'mixer_exposure',
      'scam_exposure',
      'layering',
      'peel_chain',
    ],
    dataSourcesUsed: ['Etherscan', 'OFAC SDN', 'Curated mixer/scam lists'],
    rulesVersion: '2026-04-28-r1',
    rulesFingerprint: 'sample0000000000',
    rulesDate: '2026-04-28',
    rulesRevision: 'r1',
    sanctionsFreshness: [
      { list: 'OFAC_SDN', lastSyncedAt: '2026-04-29T02:00:00.000Z', ageHours: 6, count: 3845, isStale: false },
      { list: 'EU_CFSP', lastSyncedAt: '2026-04-29T02:00:00.000Z', ageHours: 6, count: 12, isStale: false },
      { list: 'UK_HMT', lastSyncedAt: '2026-04-29T02:00:00.000Z', ageHours: 6, count: 8, isStale: false },
      { list: 'UN_SC', lastSyncedAt: '2026-04-29T02:00:00.000Z', ageHours: 6, count: 0, isStale: false },
    ],
  },
};

export function SampleReport() {
  return <Report report={SAMPLE_REPORT} variant="sample" />;
}
