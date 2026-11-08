import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET all instrument videos (returns lightweight metadata + stream URL)
export async function GET() {
  try {
    await initDb();
    const res = await pool.query(
      `SELECT id, category, title, duration, created_by, created_at,
              CASE WHEN video_url LIKE 'data:%' THEN '/api/instruments/' || id::text ELSE video_url END AS video_url
       FROM instruments
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ instruments: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create instrument video lesson (Supports chunked upload to bypass Vercel 4.5MB body limit)
export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente o admin e professor podem postar vídeos de instrumentos.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, id, chunk, category, title, video_url, duration } = body;

    // 1. Chunked upload: Append chunk to existing row
    if (action === 'append') {
      if (!id || typeof chunk !== 'string') {
        return NextResponse.json({ error: 'ID e parte do vídeo são obrigatórios.' }, { status: 400 });
      }
      await pool.query(
        'UPDATE instruments SET video_url = video_url || $1 WHERE id = $2',
        [chunk, id]
      );
      return NextResponse.json({ success: true, id });
    }

    // 2. Chunked upload: Initialize row with first chunk (or full video_url)
    const initialVideoData = typeof chunk === 'string' ? chunk : video_url;

    if (!category || !title || !initialVideoData) {
      return NextResponse.json({ error: 'Categoria, título e vídeo são obrigatórios.' }, { status: 400 });
    }

    const validCategories = ['Berimbau', 'Pandeiro', 'Atabaque', 'Agogô', 'Cuia'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO instruments (category, title, video_url, duration, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, category, title, duration, created_by, created_at`,
      [category, title, initialVideoData, duration || 'máx 2 min', session.id]
    );

    const created = res.rows[0];
    return NextResponse.json({
      success: true,
      id: created.id,
      instrument: {
        ...created,
        video_url: `/api/instruments/${created.id}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
