import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET: Stream video binary with Range support (bypasses Vercel 4.5MB response limit)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const { id } = await params;
    const res = await pool.query('SELECT video_url, title, category FROM instruments WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      return new NextResponse('Vídeo não encontrado', { status: 404 });
    }

    const rawUrl: string = res.rows[0].video_url || '';
    if (!rawUrl.startsWith('data:')) {
      return NextResponse.redirect(rawUrl);
    }

    const commaIndex = rawUrl.indexOf(',');
    if (commaIndex === -1) {
      return new NextResponse('Formato de vídeo inválido', { status: 400 });
    }

    const headerPart = rawUrl.slice(0, commaIndex);
    const base64Data = rawUrl.slice(commaIndex + 1);
    const mimeMatch = headerPart.match(/^data:([^;]+)/);
    const contentType = mimeMatch ? mimeMatch[1] : 'video/mp4';

    const videoBuffer = Buffer.from(base64Data, 'base64');
    const totalLength = videoBuffer.length;
    const MAX_CHUNK_BYTES = 3 * 1024 * 1024; // 3MB max per chunk for Vercel compatibility

    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const requestedEnd = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
      const end = Math.min(requestedEnd, start + MAX_CHUNK_BYTES - 1, totalLength - 1);

      if (start >= totalLength) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${totalLength}` },
        });
      }

      const chunk = videoBuffer.subarray(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${totalLength}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunk.length),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // If no Range header and file is larger than 3MB, return first 3MB with 206 or full if <= 3MB
    if (totalLength > MAX_CHUNK_BYTES) {
      const end = MAX_CHUNK_BYTES - 1;
      const chunk = videoBuffer.subarray(0, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes 0-${end}/${totalLength}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunk.length),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(totalLength),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente admin e professor podem excluir vídeos.' }, { status: 403 });
    }

    const { id } = await params;
    await pool.query('DELETE FROM instruments WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Vídeo excluído com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
