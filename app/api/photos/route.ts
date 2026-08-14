import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET photos gallery & automatically purge photos older than 90 days
export async function GET() {
  try {
    await initDb();
    
    // Auto-delete photos older than 90 days
    await pool.query("DELETE FROM photos WHERE created_at < NOW() - INTERVAL '90 days'");

    // Fetch active photos
    const res = await pool.query(`
      SELECT id, title, photo_url, created_at,
             GREATEST(0, 90 - EXTRACT(DAY FROM (NOW() - created_at)))::int as days_left
      FROM photos
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ photos: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST upload photo (Base64 or image URL)
export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Você precisa estar logado para enviar fotos.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, photo_url } = body;

    if (!title || !photo_url) {
      return NextResponse.json({ error: 'Título e imagem são obrigatórios.' }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO photos (title, photo_url)
       VALUES ($1, $2)
       RETURNING id, title, photo_url, created_at, 90 as days_left`,
      [title, photo_url]
    );

    return NextResponse.json({ success: true, photo: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
