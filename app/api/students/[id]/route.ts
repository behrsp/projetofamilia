import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Acesso negado. Apenas professores e administradores.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, nickname, phone, corda, role, birthdate } = body;

    const res = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           nickname = COALESCE($2, nickname),
           phone = COALESCE($3, phone),
           corda = COALESCE($4, corda),
           role = COALESCE($5, role),
           birthdate = COALESCE($6, birthdate)
       WHERE id = $7
       RETURNING id, name, nickname, phone, birthdate, corda, role, avatar_url`,
      [name, nickname, phone, corda, role, birthdate, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Acesso negado. Apenas professores e administradores.' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting self
    if (session.id === id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta.' }, { status: 400 });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Aluno removido com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
