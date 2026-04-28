import { NextResponse } from 'next/server';
import { getStorageBackend } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { renderReportPdf } from '@/lib/pdf/report-pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const { id } = await params;
  const scan = await getStorageBackend().getScan(session.userId, id);
  if (!scan) {
    return NextResponse.json(
      { error: 'not_found', message: 'Scan not found' },
      { status: 404 },
    );
  }

  const stream = await renderReportPdf(scan.report);
  // Pipe Node Readable -> Web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', (err: Error) => controller.error(err));
    },
  });

  const filename = `chainsight-${scan.address.slice(2, 10)}-${scan.chain}-${scan.scannedAt.slice(0, 10)}.pdf`;
  return new Response(webStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
