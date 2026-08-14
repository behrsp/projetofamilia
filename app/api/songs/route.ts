import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET all songs
export async function GET() {
  try {
    await initDb();
    const res = await pool.query('SELECT * FROM songs ORDER BY created_at DESC');
    return NextResponse.json({ songs: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create song (Admin & Professor only)
export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente o admin e o professor podem cadastrar músicas.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, author, lyrics, link_url } = body;

    if (!title || !lyrics) {
      return NextResponse.json({ error: 'Título e letra são obrigatórios.' }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO songs (title, author, lyrics, link_url, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, author || 'Domínio Público / ABADÁ', lyrics, link_url || '', session.id]
    );

    return NextResponse.json({ success: true, song: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
