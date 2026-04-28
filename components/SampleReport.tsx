import type { RiskReport } from '@/lib/engine/types';
import { Report } from './Report';

const SAMPLE_REPORT: RiskReport = {
  address: '0x64954fcfee8ef00416c40e3ff624dc6dde7ca0b4',
  chain: 'ethereum',
  scannedAt: '2026-04-28T11:31:00.040Z',
  riskScore: 15,
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
          amountWei: '16766170000000000000',
          timestamp: '2018-03-31T17:40:11.000Z',
          note: 'IN',
        },
        {
          txHash: '0xd229032620a4a254b6a1987d9a56c15ea8798480af99ae16a2253bbc5ffbb7a4',
          counterpartyAddress: '0x6e2e5b0bad80eac708fefe902a7e6917b95d7d2a',
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
  },
};

export function SampleReport() {
  return <Report report={SAMPLE_REPORT} variant="sample" />;
}
