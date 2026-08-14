import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET all instrument videos
export async function GET() {
  try {
    await initDb();
    const res = await pool.query('SELECT * FROM instruments ORDER BY created_at DESC');
    return NextResponse.json({ instruments: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create instrument video lesson (Admin & Professor only)
export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente o admin e professor podem postar vídeos de instrumentos.' }, { status: 403 });
    }

    const body = await req.json();
    const { category, title, video_url, duration } = body;

    if (!category || !title || !video_url) {
      return NextResponse.json({ error: 'Categoria, título e vídeo são obrigatórios.' }, { status: 400 });
    }

    const validCategories = ['Berimbau', 'Pandeiro', 'Atabaque', 'Agogô', 'Cuia'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO instruments (category, title, video_url, duration, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [category, title, video_url, duration || 'máx 2 min', session.id]
    );

    return NextResponse.json({ success: true, instrument: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
