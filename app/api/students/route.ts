import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET all students (Restricted or for cord counting dashboard)
export async function GET() {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const res = await pool.query(
      'SELECT id, name, nickname, phone, birthdate, corda, role, avatar_url, created_at FROM users ORDER BY name ASC'
    );

    return NextResponse.json({ students: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Self-update profile (Student updates their avatar, name, nickname, birthdate, corda)
export async function PUT(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, nickname, birthdate, corda, avatar_url } = body;

    const res = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           nickname = COALESCE($2, nickname),
           birthdate = COALESCE($3, birthdate),
           corda = COALESCE($4, corda),
           avatar_url = COALESCE($5, avatar_url)
       WHERE id = $6
       RETURNING id, name, nickname, phone, birthdate, corda, role, avatar_url`,
      [name, nickname, birthdate, corda, avatar_url, session.id]
    );

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
