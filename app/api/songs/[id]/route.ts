import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente admin e professor podem alterar músicas.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, author, lyrics, link_url } = body;

    const res = await pool.query(
      `UPDATE songs
       SET title = COALESCE($1, title),
           author = COALESCE($2, author),
           lyrics = COALESCE($3, lyrics),
           link_url = COALESCE($4, link_url)
       WHERE id = $5
       RETURNING *`,
      [title, author, lyrics, link_url, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Música não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, song: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente admin e professor podem excluir músicas.' }, { status: 403 });
    }

    const { id } = await params;
    await pool.query('DELETE FROM songs WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Música excluída com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
