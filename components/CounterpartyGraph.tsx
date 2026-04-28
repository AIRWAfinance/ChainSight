'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import type { CounterpartyGraph as GraphData } from '@/lib/engine/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="graph-loading">
      Initialising force-directed graph…
    </div>
  ),
});

interface CounterpartyGraphProps {
  graph: GraphData;
}

interface RenderNode {
  id: string;
  label?: string;
  category?: string;
  totalIn: number;
  totalOut: number;
  txCount: number;
  isSubject?: boolean;
  isFlagged?: boolean;
  val: number;
}

interface RenderLink {
  source: string;
  target: string;
  value: number;
  txCount: number;
}

const COLORS: Record<string, string> = {
  subject: '#d4a949',
  cex: '#5fa493',
  dex: '#87a96b',
  dex_aggregator: '#87a96b',
  bridge: '#b8a98a',
  mixer: '#d65645',
  unknown: '#7a7062',
};

function shortAddr(s: string): string {
  if (!s || s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export function CounterpartyGraph({ graph }: CounterpartyGraphProps) {
  const [hovered, setHovered] = useState<RenderNode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(() => {
    const maxVol = Math.max(
      1,
      ...graph.nodes.map((n) =>
        Math.max(n.totalIn, n.totalOut, n.isSubject ? 100 : 0),
      ),
    );

    const nodes: RenderNode[] = graph.nodes.map((n) => ({
      ...n,
      val:
        n.isSubject
          ? 24
          : 6 + 18 * (Math.max(n.totalIn, n.totalOut) / maxVol),
    }));

    const links: RenderLink[] = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      value: e.value,
      txCount: e.txCount,
    }));

    return { nodes, links };
  }, [graph]);

  if (graph.nodes.length <= 1) {
    return (
      <div className="graph-empty">
        Not enough counterparty data to plot.
      </div>
    );
  }

  return (
    <div className="graph-wrap" ref={containerRef}>
      <div className="graph-canvas">
        <ForceGraph2D
          graphData={data}
          width={typeof window !== 'undefined' ? Math.min(900, containerRef.current?.offsetWidth ?? 800) : 800}
          height={520}
          backgroundColor="#0a0807"
          nodeRelSize={4}
          linkColor={() => 'rgba(184, 173, 153, 0.25)'}
          linkWidth={(l) => {
            const link = l as RenderLink;
            return 0.5 + Math.min(3, Math.log10(1 + link.value));
          }}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={(l) => {
            const link = l as RenderLink;
            return 0.001 + Math.min(0.012, link.value / 1000);
          }}
          linkDirectionalParticleColor={() => '#d4a949'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as RenderNode & { x?: number; y?: number };
            if (n.x === undefined || n.y === undefined) return;
            const color =
              COLORS[n.category ?? 'unknown'] ?? COLORS.unknown;

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.val / 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();

            if (n.isFlagged && !n.isSubject) {
              ctx.lineWidth = 2 / globalScale;
              ctx.strokeStyle = '#d65645';
              ctx.stroke();
            }
            if (n.isSubject) {
              ctx.lineWidth = 3 / globalScale;
              ctx.strokeStyle = '#ece7df';
              ctx.stroke();
            }

            // Label
            const label = n.label ?? shortAddr(n.id);
            const fontSize = Math.max(10, 14 / globalScale);
            ctx.font = `${fontSize}px Inter Tight, sans-serif`;
            ctx.fillStyle = '#ece7df';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(label, n.x, n.y + n.val / 2 + 2);
          }}
          onNodeHover={(node) => setHovered((node as RenderNode | null) ?? null)}
          onNodeClick={(node) => setHovered(node as RenderNode)}
        />
      </div>

      <aside className="graph-side">
        <div className="lbl">Legend</div>
        <ul className="graph-legend">
          <li><span className="dot" style={{ background: COLORS.subject }} /> Subject wallet</li>
          <li><span className="dot" style={{ background: COLORS.cex }} /> Centralised exchange</li>
          <li><span className="dot" style={{ background: COLORS.dex }} /> DEX / aggregator</li>
          <li><span className="dot" style={{ background: COLORS.bridge }} /> Bridge</li>
          <li><span className="dot" style={{ background: COLORS.mixer }} /> Mixer (sanctioned)</li>
          <li><span className="dot" style={{ background: COLORS.unknown }} /> Unknown</li>
          <li><span className="ring red" /> Appears in a flag's evidence</li>
        </ul>

        <div className="lbl" style={{ marginTop: '1.25rem' }}>Inspector</div>
        {hovered ? (
          <div className="graph-inspect">
            <div className="title">{hovered.label ?? 'Unknown entity'}</div>
            <div className="addr mono">{hovered.id}</div>
            <table>
              <tbody>
                <tr><td>Category</td><td>{hovered.category}</td></tr>
                <tr><td>In</td><td>{hovered.totalIn.toFixed(4)} ETH</td></tr>
                <tr><td>Out</td><td>{hovered.totalOut.toFixed(4)} ETH</td></tr>
                <tr><td>Tx count</td><td>{hovered.txCount}</td></tr>
                {hovered.isFlagged && <tr><td>Flag</td><td style={{ color: '#d65645' }}>In evidence</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="graph-inspect empty">
            Hover or click a node to inspect.
          </div>
        )}

        <div className="graph-footnote">
          {graph.nodes.length - 1} of {graph.truncatedAt === graph.nodes.length - 1 ? graph.nodes.length - 1 : `${graph.truncatedAt}+`} counterparties shown ·
          1-hop · ranked by max(in, out) ETH volume
        </div>
      </aside>
    </div>
  );
}
